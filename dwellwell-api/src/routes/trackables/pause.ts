//dwellwell-api/src/routes/trackables/pause.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { TrackableStatus } from '@prisma/client';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  const t = await prisma.trackable.findFirst({
    where: { id: trackableId, home: { userId } },
    include: { tasks: true },
  });
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  if (t.status === 'RETIRED') return res.status(400).json({ error: 'ALREADY_RETIRED' });

  // Update trackable
  await prisma.trackable.update({
    where: { id: t.id },
    data: { status: TrackableStatus.PAUSED },
  });

  // Pause its ACTIVE tasks (mark pausedAt; keep status field untouched to preserve completion semantics)
  await prisma.userTask.updateMany({
    where: { trackableId: t.id, archivedAt: null, pausedAt: null },
    data: { pausedAt: new Date(), isTracking: false },
  });

  // Lifecycle event
  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: t.id, action: 'paused' },
  });

  res.json({ ok: true });
});
