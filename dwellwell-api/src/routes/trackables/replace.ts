import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const { trackableId } = req.params as any;
  const { newTrackable } = (req.body ?? {}) as {
    newTrackable?: {
      homeId?: string | null;
      roomId?: string | null;
      userDefinedName?: string | null;
      applianceCatalogId?: string | null;
      serialNumber?: string | null;
      notes?: string | null;
    };
  };

  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  // 1) Fetch old trackable owned by user (with its active assignment)
  const oldT = await prisma.trackable.findFirst({
    where: { id: trackableId, ownerUserId: userId },
    include: {
      assignments: { where: { endAt: null }, orderBy: { startAt: "desc" }, take: 1 },
    },
  });
  if (!oldT) return res.status(404).json({ error: "TRACKABLE_NOT_FOUND" });

  const active = oldT.assignments[0] || null;

  // 2) Validate optional new home/room targets
  if (newTrackable?.homeId) {
    const home = await prisma.home.findFirst({ where: { id: newTrackable.homeId, userId } });
    if (!home) return res.status(400).json({ error: "HOME_NOT_FOUND_OR_NOT_OWNED" });
  }
  if (newTrackable?.roomId) {
    const room = await prisma.room.findUnique({ where: { id: newTrackable.roomId } });
    if (!room) return res.status(400).json({ error: "ROOM_NOT_FOUND" });
    if (newTrackable?.homeId) {
      const roomInHome = await prisma.room.findFirst({
        where: { id: newTrackable.roomId, homeId: newTrackable.homeId },
      });
      if (!roomInHome) return res.status(400).json({ error: "ROOM_NOT_IN_HOME" });
    }
  }

  // 3) Create replacement trackable
  const created = await prisma.trackable.create({
    data: {
      ownerUserId: userId,
      userDefinedName: newTrackable?.userDefinedName ?? oldT.userDefinedName,
      applianceCatalogId: newTrackable?.applianceCatalogId ?? oldT.applianceCatalogId,
      serialNumber: newTrackable?.serialNumber ?? null,
      notes: newTrackable?.notes ?? null,
      status: "IN_USE",
    },
  });

  // 4) Supersession links + retire old
  await prisma.trackable.update({
    where: { id: oldT.id },
    data: {
      supersededBy: { connect: { id: created.id } },
      status: "RETIRED",
      retiredAt: new Date(),
      retiredReason: "REPLACED",
    },
  });

  await prisma.trackable.update({
    where: { id: created.id },
    data: { supersedes: { connect: { id: oldT.id } } },
  });

  // 5) Close active assignment for old; open new one for replacement
  const targetHomeId = newTrackable?.homeId ?? active?.homeId ?? null;
  const targetRoomId = newTrackable?.roomId ?? active?.roomId ?? null;

  if (active) {
    await prisma.trackableAssignment.updateMany({
      where: { trackableId: oldT.id, endAt: null },
      data: { endAt: new Date() },
    });
  }
  if (targetHomeId || targetRoomId) {
    await prisma.trackableAssignment.create({
      data: {
        trackableId: created.id,
        homeId: targetHomeId,
        roomId: targetRoomId,
        startAt: new Date(),
      },
    });
  }

  // 6) Archive old tasks
  await prisma.userTask.updateMany({
    where: { trackableId: oldT.id, archivedAt: null },
    data: { archivedAt: new Date(), isTracking: false, pausedAt: null },
  });

  // 7) Seed tasks for the new trackable from catalog templates (if any)
  const templates = await prisma.applianceTaskTemplate.findMany({
    where: { applianceCatalogId: created.applianceCatalogId ?? undefined },
    include: { taskTemplate: true },
  });

  if (templates.length) {
    const now = new Date();

    // Cast to InputJsonValue and only include when non-empty to satisfy createMany typing.
    const toInputJsonOrUndefined = (v: unknown): Prisma.InputJsonValue | undefined => {
      if (v == null) return undefined;
      if (Array.isArray(v) && v.length === 0) return undefined;
      return v as unknown as Prisma.InputJsonValue;
    };

    await prisma.userTask.createMany({
      data: templates.map((t) => {
        const base = {
          id: crypto.randomUUID(),
          userId,
          homeId: targetHomeId ?? null,
          roomId: targetRoomId ?? null,
          trackableId: created.id,
          taskTemplateId: t.taskTemplateId,
          sourceType: "trackable" as const,
          title: t.taskTemplate.title,
          description: t.taskTemplate.description ?? "",
          dueDate: computeInitialDue(now, t.taskTemplate.recurrenceInterval),
          status: "PENDING" as const,
          itemName: created.userDefinedName ?? "",
          category: t.taskTemplate.category ?? "general",
          estimatedTimeMinutes: t.taskTemplate.estimatedTimeMinutes ?? 0,
          estimatedCost: t.taskTemplate.estimatedCost ?? 0,
          criticality: t.taskTemplate.criticality,
          deferLimitDays: t.taskTemplate.deferLimitDays ?? 0,
          canBeOutsourced: t.taskTemplate.canBeOutsourced ?? false,
          canDefer: t.taskTemplate.canDefer ?? true,
          recurrenceInterval: t.taskTemplate.recurrenceInterval ?? "",
          taskType: t.taskTemplate.taskType,
          dedupeKey: `${created.id}:${t.taskTemplateId}`,
          icon: t.taskTemplate.icon ?? null,
          imageUrl: t.taskTemplate.imageUrl ?? null,
          sourceTemplateVersion: t.taskTemplate.version,
        };

        // Conditionally add JSON fields to avoid null/JsonValue type issues
        const steps = toInputJsonOrUndefined(t.taskTemplate.steps ?? []);
        const equipmentNeeded = toInputJsonOrUndefined(t.taskTemplate.equipmentNeeded ?? []);
        const resources = toInputJsonOrUndefined(t.taskTemplate.resources ?? []);

        return {
          ...base,
          ...(steps !== undefined ? { steps } : {}),
          ...(equipmentNeeded !== undefined ? { equipmentNeeded } : {}),
          ...(resources !== undefined ? { resources } : {}),
        };
      }),
      skipDuplicates: true,
    });
  }

  // 8) Lifecycle log
  await prisma.lifecycleEvent.create({
    data: {
      userId,
      entity: "trackable",
      entityId: oldT.id,
      action: "replaced",
      metadata: { newId: created.id },
    },
  });

  res.status(201).json({ oldId: oldT.id, newId: created.id });
});

/** Simple interval parser for first due date */
function computeInitialDue(base: Date, rec: string | null | undefined) {
  const d = new Date(base);
  const r = (rec || "").toLowerCase();
  const n = parseInt(r.match(/\d+/)?.[0] ?? "1", 10);
  if (r.includes("day")) d.setDate(d.getDate() + n);
  else if (r.includes("week")) d.setDate(d.getDate() + 7 * n);
  else if (r.includes("month")) d.setMonth(d.getMonth() + n);
  else if (r.includes("year")) d.setFullYear(d.getFullYear() + n);
  else d.setDate(d.getDate() + 30);
  return d;
}
