//dwellwell-api/src/routes/rooms/list.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const homeId = String(req.query.homeId || '');
  if (!homeId) return res.status(400).json({ error: 'HOME_ID_REQUIRED' });

  const rooms = await prisma.room.findMany({
    where: { homeId, home: { userId } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  res.json(rooms);
});
