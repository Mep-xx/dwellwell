//dwellwell-api/src/routes/trackables/remove.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { getOwnedTrackable } from './_getOwned';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  const t = await getOwnedTrackable(userId, trackableId);
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  await prisma.trackable.delete({ where: { id: trackableId } });

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: trackableId, action: 'deleted' },
  });

  res.json({ ok: true });
});
