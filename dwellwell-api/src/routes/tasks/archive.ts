//dwellwell-api/src/routes/tasks/archive.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;

  const t = await prisma.userTask.findFirst({ where: { id: taskId, userId } });
  if (!t) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  const updated = await prisma.userTask.update({
    where: { id: t.id },
    data: { archivedAt: new Date(), pausedAt: null, isTracking: false },
  });

  await prisma.lifecycleEvent.create({ data: { userId, entity: 'task', entityId: t.id, action: 'archived' } });
  res.json(updated);
});
