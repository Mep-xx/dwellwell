import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import crypto from 'crypto';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;
  const { newTrackable } = req.body ?? {}; // optional overrides: { homeId?, roomId?, userDefinedName?, applianceCatalogId?, serialNumber?, notes? }

  // Fetch old trackable owned by user, plus its active assignment
  const oldT = await prisma.trackable.findFirst({
    where: { id: trackableId, ownerUserId: userId },
    include: {
      assignments: { where: { endAt: null }, orderBy: { startAt: 'desc' }, take: 1 },
    },
  });
  if (!oldT) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  const active = oldT.assignments[0] || null;

  // If caller provided a new home/room, validate (home must be user's; room must exist and belong to home if both given)
  if (newTrackable?.homeId) {
    const home = await prisma.home.findFirst({ where: { id: newTrackable.homeId, userId } });
    if (!home) return res.status(400).json({ error: 'HOME_NOT_FOUND_OR_NOT_OWNED' });
  }
  if (newTrackable?.roomId) {
    const room = await prisma.room.findUnique({ where: { id: newTrackable.roomId } });
    if (!room) return res.status(400).json({ error: 'ROOM_NOT_FOUND' });
    if (newTrackable?.homeId) {
      const roomInHome = await prisma.room.findFirst({ where: { id: newTrackable.roomId, homeId: newTrackable.homeId } });
      if (!roomInHome) return res.status(400).json({ error: 'ROOM_NOT_IN_HOME' });
    }
  }

  // Create the new trackable, owned by same user
  const created = await prisma.trackable.create({
    data: {
      ownerUserId: userId,
      userDefinedName: newTrackable?.userDefinedName ?? oldT.userDefinedName,
      applianceCatalogId: newTrackable?.applianceCatalogId ?? oldT.applianceCatalogId,
      serialNumber: newTrackable?.serialNumber ?? null,
      notes: newTrackable?.notes ?? null,
      status: 'IN_USE',
    },
  });

  // Supersession links (must use relation connect)
  await prisma.trackable.update({
    where: { id: oldT.id },
    data: {
      supersededBy: { connect: { id: created.id } },
      status: 'RETIRED',
      retiredAt: new Date(),
      retiredReason: 'REPLACED',
    },
  });

  await prisma.trackable.update({
    where: { id: created.id },
    data: {
      supersedes: { connect: { id: oldT.id } },
    },
  });

  // Close any active assignment on old, and create assignment for new
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

  // Archive old tasks
  await prisma.userTask.updateMany({
    where: { trackableId: oldT.id, archivedAt: null },
    data: { archivedAt: new Date(), isTracking: false, pausedAt: null },
  });

  // Seed tasks for new (if catalog templates exist)
  const templates = await prisma.applianceTaskTemplate.findMany({
    where: { applianceCatalogId: created.applianceCatalogId ?? undefined },
    include: { taskTemplate: true },
  });

  const now = new Date();
  if (templates.length) {
    await prisma.userTask.createMany({
      data: templates.map((t) => ({
        id: crypto.randomUUID(),
        userId,
        roomId: targetRoomId ?? null,
        trackableId: created.id,
        taskTemplateId: t.taskTemplateId,
        sourceType: 'trackable',
        title: t.taskTemplate.title,
        description: t.taskTemplate.description ?? '',
        dueDate: computeInitialDue(now, t.taskTemplate.recurrenceInterval),
        status: 'PENDING',
        itemName: created.userDefinedName ?? '',
        category: t.taskTemplate.category ?? 'general',
        estimatedTimeMinutes: t.taskTemplate.estimatedTimeMinutes ?? 0,
        estimatedCost: t.taskTemplate.estimatedCost ?? 0,
        criticality: t.taskTemplate.criticality,
        deferLimitDays: t.taskTemplate.deferLimitDays ?? 0,
        canBeOutsourced: t.taskTemplate.canBeOutsourced ?? false,
        canDefer: t.taskTemplate.canDefer ?? true,
        recurrenceInterval: t.taskTemplate.recurrenceInterval ?? '',
        taskType: t.taskTemplate.taskType,
        dedupeKey: crypto.randomUUID(),
        steps: (t.taskTemplate.steps as any) ?? undefined,
        equipmentNeeded: (t.taskTemplate.equipmentNeeded as any) ?? undefined,
        resources: (t.taskTemplate.resources as any) ?? undefined,
        icon: t.taskTemplate.icon ?? undefined,
        imageUrl: t.taskTemplate.imageUrl ?? undefined,
        sourceTemplateVersion: t.taskTemplate.version,
      })),
    });
  }

  // Lifecycle log
  await prisma.lifecycleEvent.create({
    data: {
      userId,
      entity: 'trackable',
      entityId: oldT.id,
      action: 'replaced',
      metadata: { newId: created.id },
    },
  });

  res.status(201).json({ oldId: oldT.id, newId: created.id });

  function computeInitialDue(base: Date, rec: string) {
    const d = new Date(base);
    const r = (rec || '').toLowerCase();
    const n = parseInt(r.match(/\d+/)?.[0] ?? '1', 10);
    if (r.includes('day')) d.setDate(d.getDate() + n);
    else if (r.includes('week')) d.setDate(d.getDate() + 7 * n);
    else if (r.includes('month')) d.setMonth(d.getMonth() + n);
    else if (r.includes('year')) d.setFullYear(d.getFullYear() + n);
    else d.setDate(d.getDate() + 30);
    return d;
  }
});
