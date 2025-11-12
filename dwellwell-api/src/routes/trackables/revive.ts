//dwellwell-api/src/routes/trackables/revive.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { getOwnedTrackable } from './_getOwned';

function nextFromToday(rec: string) {
  const d = new Date();
  const r = (rec || '').toLowerCase();
  const n = parseInt(r.match(/\d+/)?.[0] ?? '1', 10);
  if (r.includes('day')) d.setDate(d.getDate() + n);
  else if (r.includes('week')) d.setDate(d.getDate() + 7 * n);
  else if (r.includes('month')) d.setMonth(d.getMonth() + n);
  else if (r.includes('year')) d.setFullYear(d.getFullYear() + n);
  else d.setDate(d.getDate() + 30);
  return d;
}

export default asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id as string | undefined;
  const { trackableId } = req.params as any;

  if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' }); // ← add this

  const t = await getOwnedTrackable(userId, trackableId);
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  await prisma.trackable.update({
    where: { id: trackableId },
    data: { status: 'IN_USE', retiredAt: null, retiredReason: null },
  });

  const tasks = await prisma.userTask.findMany({
    where: { trackableId, userId },
    select: { id: true, archivedAt: true, dueDate: true, recurrenceInterval: true },
  });

  const now = new Date();
  const tx = tasks.map((x: { id: string; archivedAt: Date | null; dueDate: Date; recurrenceInterval: string | null }) => {
    const data: any = { archivedAt: null, pausedAt: null, isTracking: true };
    if (x.dueDate < now) data.dueDate = nextFromToday(x.recurrenceInterval || '');
    return prisma.userTask.update({ where: { id: x.id }, data });
  });
  if (tx.length) await prisma.$transaction(tx);

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: trackableId, action: 'revived' },
  });

  res.json({ ok: true });
});
