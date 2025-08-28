//dwellwell-api/src/routes/tasks/snooze.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;
  const { days = 7 } = req.body ?? {};

  const task = await prisma.userTask.findFirst({ where: { id: taskId, userId } });
  if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  const due = task.dueDate ? new Date(task.dueDate) : new Date();
  due.setDate(due.getDate() + Number(days || 7));

  const updated = await prisma.userTask.update({ where: { id: taskId }, data: { dueDate: due } });
  res.json(updated);
});
