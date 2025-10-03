// dwellwell-api/src/routes/tasks/uncomplete.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;

  const task = await prisma.userTask.findFirst({ where: { id: taskId, userId } });
  if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  const updated = await prisma.userTask.update({
    where: { id: taskId },
    data: {
      status: 'PENDING',
      completedDate: null,
    },
  });

  res.json(updated);
});