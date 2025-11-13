//dwellwell-api/src/routes/tasks/resume.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { forwardFrom } from '../../lib/recurrence';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;
  const { mode = 'forward' } = req.body ?? {};

  const t = await prisma.userTask.findFirst({ where: { id: taskId, userId } });
  if (!t) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  const now = new Date();
  const nextDue = mode === 'forward' ? forwardFrom(now, t.recurrenceInterval) : now;

  const updated = await prisma.userTask.update({
    where: { id: t.id },
    data: { pausedAt: null, isTracking: true, dueDate: nextDue },
  });

  await prisma.lifecycleEvent.create({ data: { userId, entity: 'task', entityId: t.id, action: 'resumed', metadata: { mode } } });
  res.json(updated);
});
