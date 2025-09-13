//dwellwell-api/src/routes/trackables/revive.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { TrackableStatus } from '@prisma/client';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;
  const { mode = 'forward' } = req.body ?? {};

  const t = await prisma.trackable.findFirst({
    where: { id: trackableId, home: { userId } },
  });
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });
  if (t.status !== 'RETIRED') return res.status(400).json({ error: 'NOT_RETIRED' });

  await prisma.trackable.update({
    where: { id: t.id },
    data: { status: TrackableStatus.IN_USE, retiredAt: null, retiredReason: null },
  });

  // Reactivate tasks (previously archived)
  const archived = await prisma.userTask.findMany({
    where: { trackableId: t.id, NOT: { archivedAt: null } },
  });

  const now = new Date();
  for (const ut of archived) {
    await prisma.userTask.update({
      where: { id: ut.id },
      data: {
        archivedAt: null,
        pausedAt: null,
        isTracking: true,
        dueDate: mode === 'forward' ? addDefaultCadence(now, ut.recurrenceInterval) : now,
      },
    });
  }

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: t.id, action: 'revived', metadata: { mode } },
  });

  res.json({ ok: true });

  function addDefaultCadence(base: Date, rec: string) {
    const d = new Date(base);
    const r = (rec || '').toLowerCase();
    if (r.includes('day')) d.setDate(d.getDate() + parseInt(r));
    else if (r.includes('week')) d.setDate(d.getDate() + 7 * parseInt(r));
    else if (r.includes('month')) d.setMonth(d.getMonth() + parseInt(r));
    else if (r.includes('year')) d.setFullYear(d.getFullYear() + parseInt(r));
    else d.setDate(d.getDate() + 30);
    return d;
  }
});
