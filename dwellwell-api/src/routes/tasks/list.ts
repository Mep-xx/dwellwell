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

  const showPaused = req.query.showPaused === '1';
  const showArchived = req.query.showArchived === '1';
  const trackableId = (req.query.trackableId as string) || undefined;

  const where: any = {
    userId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(trackableId ? { trackableId } : {}),
  };

  // Hide archived by default
  if (!showArchived) where.archivedAt = null;
  // Hide paused unless requested
  if (!showPaused) where.pausedAt = null;

  const tasks = await prisma.userTask.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  res.json(tasks);
});
