//dwellwell-api/src/routes/trackables/replace.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import crypto from "crypto";

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

  const oldT = await prisma.trackable.findFirst({
    where: { id: trackableId, ownerUserId: userId },
    include: {
      assignments: { where: { endAt: null }, orderBy: { startAt: "desc" }, take: 1 },
    },
  });
  if (!oldT) return res.status(404).json({ error: "TRACKABLE_NOT_FOUND" });

  const active = oldT.assignments[0] || null;

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

  await prisma.userTask.updateMany({
    where: { trackableId: oldT.id, archivedAt: null },
    data: { archivedAt: new Date(), isTracking: false, pausedAt: null },
  });

  const templates = await prisma.applianceTaskTemplate.findMany({
    where: { applianceCatalogId: created.applianceCatalogId ?? undefined },
    include: { taskTemplate: true },
  });

  if (templates.length) {
    const now = new Date();

    const toInputJsonOrUndefined = (v: unknown): any => {
      if (v == null) return undefined;
      if (Array.isArray(v) && v.length === 0) return undefined;
      return v as any;
    };

    await prisma.userTask.createMany({
      data: templates.map((t: any) => {
        const tt = t.taskTemplate;
        const base = {
          id: crypto.randomUUID(),
          userId,
          homeId: targetHomeId ?? null,
          roomId: targetRoomId ?? null,
          trackableId: created.id,
          taskTemplateId: tt.id,
          sourceType: "trackable" as any,
          title: tt.title,
          description: tt.description ?? "",
          dueDate: computeInitialDue(now, tt.recurrenceInterval),
          status: "PENDING" as any,
          itemName: created.userDefinedName ?? "",
          category: tt.category ?? "general",
          estimatedTimeMinutes: tt.estimatedTimeMinutes ?? 0,
          estimatedCost: tt.estimatedCost ?? 0,
          criticality: tt.criticality,
          deferLimitDays: tt.deferLimitDays ?? 0,
          canBeOutsourced: tt.canBeOutsourced ?? false,
          canDefer: tt.canDefer ?? true,
          recurrenceInterval: tt.recurrenceInterval ?? "",
          taskType: tt.taskType,
          dedupeKey: `${created.id}:${tt.id}`,
          icon: tt.icon ?? null,
          imageUrl: tt.imageUrl ?? null,
          sourceTemplateVersion: tt.version,
        };

        const steps = toInputJsonOrUndefined(tt.steps ?? []);
        const equipmentNeeded = toInputJsonOrUndefined(tt.equipmentNeeded ?? []);
        const resources = toInputJsonOrUndefined(tt.resources ?? []);

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
