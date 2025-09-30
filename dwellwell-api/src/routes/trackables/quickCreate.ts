//dwellwell-api/src/routes/trackables/quickCreate.ts
import type { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";

function titleCaseKind(kind: string) {
  return kind.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function computeNextDueFromInterval(recurrenceInterval?: string | null): Date {
  // naive: if you store "P90D" or "90d" you can parse; for now default 90d
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d;
}

export default [requireAuth, async function quickCreate(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { roomId, homeId, kind, category, userDefinedName } = req.body as {
    roomId: string;
    homeId?: string;
    kind: string;
    category?: string | null;
    userDefinedName?: string | null;
  };

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!roomId || !kind) {
    return res.status(400).json({ error: "roomId and kind are required" });
  }

  // De-dupe: same room + kind + IN_USE
  const existing = await prisma.trackable.findFirst({
    where: { roomId, kind, status: "IN_USE" },
    select: { id: true },
  });
  if (existing) return res.json({ id: existing.id, deduped: true });

  // Create generic trackable
  const name = userDefinedName ?? titleCaseKind(kind);
  const trackable = await prisma.trackable.create({
    data: {
      ownerUserId: userId,
      homeId: homeId ?? undefined,
      roomId,
      kind,
      category: category ?? null,
      userDefinedName: name,
      isGeneric: true,
      detailLevel: "generic",
      source: "user_quick_prompt",
      status: "IN_USE",
      notes: "Added via Quick Prompts",
    },
    select: { id: true, homeId: true, roomId: true, kind: true }
  });

  // Create active assignment row (optional but nice for history)
  await prisma.trackableAssignment.create({
    data: {
      trackableId: trackable.id,
      homeId: trackable.homeId ?? null,
      roomId: trackable.roomId ?? null,
      startAt: new Date(),
    },
  }).catch(() => {});

  // Seed generic tasks using the new kind->template mapping
  const kindMappings = await prisma.trackableKindTaskTemplate.findMany({
    where: { kind },
    select: { taskTemplate: { select: {
      id: true, title: true, description: true, recurrenceInterval: true,
      taskType: true, criticality: true, canDefer: true, deferLimitDays: true,
      estimatedTimeMinutes: true, estimatedCost: true, canBeOutsourced: true,
      icon: true, imageUrl: true, category: true
    } } }
  });

  if (kindMappings.length) {
    await prisma.userTask.createMany({
      data: kindMappings.map(({ taskTemplate }) => ({
        userId,
        homeId: trackable.homeId ?? undefined,
        roomId: trackable.roomId ?? undefined,
        trackableId: trackable.id,
        taskTemplateId: taskTemplate.id,
        sourceType: "trackable",
        title: taskTemplate.title,
        description: taskTemplate.description ?? "",
        dueDate: computeNextDueFromInterval(taskTemplate.recurrenceInterval),
        status: "PENDING",
        sourceTemplateVersion: 1,
        itemName: name,
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
        dedupeKey: `${trackable.id}:${taskTemplate.id}`, // safe unique
        icon: taskTemplate.icon ?? null,
        imageUrl: taskTemplate.imageUrl ?? null,
      })),
      skipDuplicates: true,
    });
  }

  return res.json({ id: trackable.id });
}];
