//dwellwell-api/src/routes/rooms/update.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { roomId } = req.params as any;

  const room = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
  });
  if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });

  const data: any = {};
  if (req.body.type !== undefined) data.type = req.body.type;
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.floor !== undefined) data.floor = req.body.floor;

  const updated = await prisma.room.update({ where: { id: roomId }, data });
  res.json(updated);
});
