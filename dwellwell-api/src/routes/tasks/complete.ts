// dwellwell-api/src/routes/tasks/complete.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { TaskStatus } from '@prisma/client';

function resolveDoneStatus(): TaskStatus {
  // Accept a few common variants in case your enum name differs
  const candidates = ['done', 'completed', 'complete'];
  const values = Object.values(TaskStatus) as string[];
  const match = values.find(v => candidates.includes(v.toLowerCase()));
  if (!match) {
    throw Object.assign(new Error('DONE_STATUS_NOT_FOUND'), { allowed: values });
  }
  return match as TaskStatus;
}

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;

  const task = await prisma.userTask.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  let DONE: TaskStatus;
  try {
    DONE = resolveDoneStatus();
  } catch (e: any) {
    return res.status(400).json({
      error: 'DONE_STATUS_NOT_FOUND',
      allowed: e?.allowed ?? Object.values(TaskStatus),
    });
  }

  const updated = await prisma.userTask.update({
    where: { id: taskId },
    data: {
      status: DONE,               // enum-safe
      completedDate: new Date(),  // <-- your schema field
    },
  });

  res.json(updated);
});
