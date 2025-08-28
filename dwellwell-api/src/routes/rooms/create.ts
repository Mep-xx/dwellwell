// dwellwell-api/src/routes/rooms/create.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { homeId, type, name, floor } = req.body ?? {};
  if (!homeId || !type) return res.status(400).json({ error: 'VALIDATION_FAILED' });

  const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
  if (!home) return res.status(404).json({ error: 'HOME_NOT_FOUND' });

  const last = await prisma.room.findFirst({
    where: { homeId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const room = await prisma.room.create({
    data: { homeId, type, name, floor, position: (last?.position ?? -1) + 1 },
  });

  res.status(201).json(room);
});
