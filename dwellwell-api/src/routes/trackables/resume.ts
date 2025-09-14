//dwellwell-api/src/routes/trackables/resume.ts
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

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  const t = await getOwnedTrackable(userId, trackableId);
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  if (t.status !== 'IN_USE') {
    await prisma.trackable.update({ where: { id: trackableId }, data: { status: 'IN_USE' } });
  }

  const tasks = await prisma.userTask.findMany({
    where: { trackableId, userId, archivedAt: null },
    select: { id: true, dueDate: true, recurrenceInterval: true, isTracking: true },
  });

  const now = new Date();
  const tx = tasks.map((x) => {
    const data: any = { pausedAt: null, isTracking: true };
    if (x.dueDate < now) data.dueDate = nextFromToday(x.recurrenceInterval);
    return prisma.userTask.update({ where: { id: x.id }, data });
  });
  if (tx.length) await prisma.$transaction(tx);

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: trackableId, action: 'resumed' },
  });

  res.json({ ok: true });
});
