//dwellwell-api/src/routes/trackables/retire.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { TrackableStatus, RetiredReason } from '@prisma/client';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;
  const { reason = 'OTHER' } = req.body ?? {};

  const t = await prisma.trackable.findFirst({
    where: { id: trackableId, home: { userId } },
  });
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  await prisma.trackable.update({
    where: { id: t.id },
    data: {
      status: TrackableStatus.RETIRED,
      retiredAt: new Date(),
      retiredReason: (reason in RetiredReason ? reason : 'OTHER') as RetiredReason,
    },
  });

  // Archive associated tasks
  await prisma.userTask.updateMany({
    where: { trackableId: t.id, archivedAt: null },
    data: { archivedAt: new Date(), isTracking: false, pausedAt: null },
  });

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: t.id, action: 'retired', metadata: { reason } },
  });

  res.json({ ok: true });
});
