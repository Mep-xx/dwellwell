// dwellwell-api/src/routes/rooms/tasks.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { roomId } = req.params as any;

  // Verify room belongs to user
  const room = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    select: { id: true },
  });
  if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });

  const tasks = await prisma.userTask.findMany({
    where: { userId, roomId },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });

  res.json(tasks);
});
