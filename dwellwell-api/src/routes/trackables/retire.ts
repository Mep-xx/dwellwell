//dwellwell-api/src/routes/trackables/retire.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { getOwnedTrackable } from './_getOwned';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;
  const { reason } = req.body ?? {};

  const t = await getOwnedTrackable(userId, trackableId);
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  await prisma.trackable.update({
    where: { id: trackableId },
    data: { status: 'RETIRED', retiredAt: new Date(), retiredReason: reason ?? 'OTHER' },
  });

  await prisma.userTask.updateMany({
    where: { trackableId, userId, archivedAt: null },
    data: { archivedAt: new Date(), isTracking: false, pausedAt: null },
  });

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: trackableId, action: 'retired', metadata: { reason: reason ?? 'OTHER' } },
  });

  res.json({ ok: true });
});
