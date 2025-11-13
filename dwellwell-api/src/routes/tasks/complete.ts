// dwellwell-api/src/routes/tasks/complete.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { nextDueOnComplete } from '../../lib/recurrence';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const { taskId } = req.params as any;
  if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const task = await prisma.userTask.findFirst({
    where: { id: taskId, userId },
    select: {
      id: true,
      status: true,
      recurrenceInterval: true,
      dueDate: true,
    },
  });
  if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  const now = new Date();
  const next = nextDueOnComplete(task.recurrenceInterval, now);

  const updated = await prisma.userTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      completedDate: now,
      ...(next ? { dueDate: next } : {}), // if not recurring, we leave dueDate as-is
    },
  });

  res.json(updated);
});
