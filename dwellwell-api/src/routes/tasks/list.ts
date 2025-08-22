// dwellwell-api/src/routes/tasks/list.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { TaskStatus } from '@prisma/client';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const statusParam = (req.query.status as string | undefined)?.trim();

  let statusFilter: TaskStatus | undefined;

  if (statusParam) {
    // Normalize case and map to the enum
    const match = (Object.values(TaskStatus) as string[]).find(
      v => v.toLowerCase() === statusParam.toLowerCase()
    );
    if (!match) {
      return res
        .status(400)
        .json({ error: 'INVALID_STATUS', allowed: Object.values(TaskStatus) });
    }
    statusFilter = match as TaskStatus;
  }

  const tasks = await prisma.userTask.findMany({
    where: {
      userId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: [
      { dueDate: 'asc' },   // if your model doesn't have dueDate, remove this line
      { createdAt: 'desc' },
    ],
  });

  res.json(tasks);
});
