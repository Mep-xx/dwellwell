//dwellwell-api/src/routes/tasks/resume.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;
  const { mode = 'forward' } = req.body ?? {};

  const t = await prisma.userTask.findFirst({ where: { id: taskId, userId } });
  if (!t) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  const now = new Date();
  const nextDue = mode === 'forward' ? forward(now, t.recurrenceInterval) : now;

  const updated = await prisma.userTask.update({
    where: { id: t.id },
    data: { pausedAt: null, isTracking: true, dueDate: nextDue },
  });

  await prisma.lifecycleEvent.create({ data: { userId, entity: 'task', entityId: t.id, action: 'resumed', metadata: { mode } } });
  res.json(updated);

  function forward(base: Date, rec: string) {
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
