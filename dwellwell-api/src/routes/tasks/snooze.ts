//dwellwell-api/src/routes/tasks/snooze.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;
  const requestedDays = Number((req.body?.days ?? 7));

  const task = await prisma.userTask.findFirst({
    where: { id: taskId, userId },
    select: {
      id: true,
      dueDate: true,
      canDefer: true,
      deferLimitDays: true,
    },
  });
  if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  if (!task.canDefer) {
    return res.status(422).json({ error: 'SNOOZE_NOT_ALLOWED' });
  }

  let days = isFinite(requestedDays) ? Math.max(1, requestedDays) : 7;
  if ((task.deferLimitDays ?? 0) > 0) {
    days = Math.min(days, task.deferLimitDays!);
  }

  const from = task.dueDate ? new Date(task.dueDate) : new Date();
  const due = new Date(from.getTime());
  due.setDate(due.getDate() + days);

  const updated = await prisma.userTask.update({
    where: { id: taskId },
    data: { dueDate: due },
  });

  res.json(updated);
});
