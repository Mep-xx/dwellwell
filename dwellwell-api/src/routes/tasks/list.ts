// dwellwell-api/src/routes/tasks/list.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId, status } = req.query as { trackableId?: string; status?: string };

  const where: any = { userId };

  // Trackable scoping
  if (trackableId) where.trackableId = String(trackableId);

  // Accept friendly status param
  // - "active" → not archived, status=PENDING (and not paused; paused tasks still exist but are flagged)
  // - otherwise allow raw enum values if you use them directly
  if (status && String(status).toLowerCase() === 'active') {
    where.archivedAt = null;
    where.status = 'PENDING'; // adjust if you want to include SKIPPED; usually "active" = do-able
  } else if (status) {
    where.status = String(status).toUpperCase();
  }

  const tasks = await prisma.userTask.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  res.json(tasks);
});
