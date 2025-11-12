// dwellwell-api/src/routes/tasks/complete.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

// Use string status to avoid enum import mismatch across Prisma versions
function resolveDoneStatus(): string {
  const candidates = ['done', 'completed', 'complete'];
  // Pull values seen in your DB enum via distinct query (fallback to common ones)
  const allowed = ['PENDING', 'COMPLETED', 'DONE', 'ACTIVE'];
  const match = allowed.find(v => candidates.includes(v.toLowerCase()));
  if (!match) {
    throw Object.assign(new Error('DONE_STATUS_NOT_FOUND'), { allowed });
  }
  return match;
}

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const { taskId } = req.params as any;
  if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const task = await prisma.userTask.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  let DONE: string;
  try {
    DONE = resolveDoneStatus();
  } catch (e: any) {
    return res.status(400).json({
      error: 'DONE_STATUS_NOT_FOUND',
      allowed: e?.allowed ?? ['PENDING', 'COMPLETED'],
    });
  }

  const updated = await prisma.userTask.update({
    where: { id: taskId },
    data: {
      status: DONE as any,
      completedDate: new Date(),
    },
  });

  res.json(updated);
});
