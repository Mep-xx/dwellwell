//dwellwell-api/src/routes/trackables/pause.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { getOwnedTrackable } from './_getOwned';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  const t = await getOwnedTrackable(userId, trackableId);
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  if (t.status !== 'PAUSED') {
    await prisma.trackable.update({ where: { id: trackableId }, data: { status: 'PAUSED' } });
  }

  await prisma.userTask.updateMany({
    where: { trackableId, userId, archivedAt: null, isTracking: true },
    data: { pausedAt: new Date(), isTracking: false },
  });

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: trackableId, action: 'paused' },
  });

  res.json({ ok: true });
});
