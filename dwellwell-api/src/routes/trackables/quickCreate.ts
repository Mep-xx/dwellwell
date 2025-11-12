// dwellwell-api/src/routes/trackables/quickCreate.ts
import type { Request, Response } from "express";
import { prisma } from "../../db/prisma";

function titleCaseKind(kind: string) {
  return kind
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function computeNextDueFromInterval(recurrenceInterval?: string | null): Date {
  const d = new Date();
  const r = (recurrenceInterval || "").toLowerCase();
  const n = parseInt(r.match(/\d+/)?.[0] ?? "3", 10);
  if (r.includes("day")) d.setDate(d.getDate() + n);
  else if (r.includes("week")) d.setDate(d.getDate() + 7 * n);
  else if (r.includes("month")) d.setMonth(d.getMonth() + n);
  else if (r.includes("year")) d.setFullYear(d.getFullYear() + n);
  else d.setDate(d.getDate() + 90);
  return d;
}

export default async function quickCreate(req: Request, res: Response) {
  const userId = (req as any).user?.id as string | undefined;
  const { roomId, homeId: homeIdInput, kind: rawKind, category, userDefinedName } = (req.body ?? {}) as {
    roomId: string;
    homeId?: string | null;
    kind: string;
    category?: string | null;
    userDefinedName?: string | null;
  };

  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  if (!roomId || !rawKind) {
    return res.status(400).json({ error: "roomId and kind are required" });
  }

  const kind = String(rawKind).trim().toLowerCase();

  const room = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    select: { id: true, homeId: true, name: true },
  });
  if (!room) {
    return res.status(400).json({ error: "ROOM_NOT_FOUND_OR_NOT_OWNED" });
  }

  const homeId = homeIdInput ?? room.homeId;

  const existing = await prisma.trackable.findFirst({
    where: { roomId: room.id, kind, status: "IN_USE" },
    select: { id: true },
  });
  if (existing) {
    return res.json({ id: existing.id, deduped: true });
  }

  const defaultName = userDefinedName ?? titleCaseKind(kind);
  const trackable = await prisma.trackable.create({
    data: {
      ownerUserId: userId,
      homeId,
      roomId: room.id,
      kind,
      category: category ?? null,
      userDefinedName: defaultName,
      isGeneric: true,
      detailLevel: "generic",
      source: "user_quick_prompt",
      status: "IN_USE",
      notes: "Added via Quick Prompts",
    },
    select: { id: true, homeId: true, roomId: true, kind: true },
  });

  try {
    await prisma.trackableAssignment.create({
      data: {
        trackableId: trackable.id,
        homeId: trackable.homeId ?? null,
        roomId: trackable.roomId ?? null,
        startAt: new Date(),
      },
    });
  } catch {/* non-fatal */ }

  const kindMappings = await prisma.trackableKindTaskTemplate.findMany({
    where: { kind },
    select: {
      taskTemplate: {
        select: {
          id: true,
          title: true,
          description: true,
          recurrenceInterval: true,
          taskType: true,
          criticality: true,
          canDefer: true,
          deferLimitDays: true,
          estimatedTimeMinutes: true,
          estimatedCost: true,
          canBeOutsourced: true,
          icon: true,
          imageUrl: true,
          category: true,
          version: true,
        },
      },
    },
  });

  if (kindMappings.length) {
    await prisma.userTask.createMany({
      data: kindMappings.map(({ taskTemplate }: { taskTemplate: any }) => ({
        userId,
        homeId: trackable.homeId ?? undefined,
        roomId: trackable.roomId ?? undefined,
        trackableId: trackable.id,
        taskTemplateId: taskTemplate.id,
        sourceType: "trackable" as any,
        title: taskTemplate.title,
        description: taskTemplate.description ?? "",
        dueDate: computeNextDueFromInterval(taskTemplate.recurrenceInterval),
        status: "PENDING" as any,
        sourceTemplateVersion: taskTemplate.version ?? 1,
        itemName: defaultName,
        category: taskTemplate.category ?? (kind || "general"),
        location: undefined,
        estimatedTimeMinutes: taskTemplate.estimatedTimeMinutes ?? 0,
        estimatedCost: taskTemplate.estimatedCost ?? 0,
        criticality: taskTemplate.criticality ?? "medium",
        deferLimitDays: taskTemplate.deferLimitDays ?? 0,
        canBeOutsourced: taskTemplate.canBeOutsourced ?? false,
        canDefer: taskTemplate.canDefer ?? true,
        isTracking: true,
        recurrenceInterval: taskTemplate.recurrenceInterval ?? "",
        taskType: taskTemplate.taskType ?? "GENERAL",
        dedupeKey: `${trackable.id}:${taskTemplate.id}`,
        icon: taskTemplate.icon ?? null,
        imageUrl: taskTemplate.imageUrl ?? null,
      })),
      skipDuplicates: true,
    });
  }

  return res.json({ id: trackable.id });
}
