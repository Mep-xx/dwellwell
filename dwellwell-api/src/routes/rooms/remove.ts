import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { roomId } = req.params as any;

  const room = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    select: { id: true },
  });
  if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });

  await prisma.room.delete({ where: { id: roomId } });
  res.json({ ok: true });
});
