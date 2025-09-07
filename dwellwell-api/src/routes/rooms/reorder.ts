// dwellwell-api/src/routes/rooms/reorder.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const body = req.body ?? {};

  if ('propertyId' in body) {
    return res.status(400).json({ error: 'DO_NOT_USE_PROPERTY_ID' });
  }

  const { homeId, roomIds } = body;

  if (!homeId || !Array.isArray(roomIds)) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      details: { homeId: !!homeId, roomIds: Array.isArray(roomIds) },
    });
  }

  const home = await prisma.home.findFirst({
    where: { id: homeId, userId },
    select: { id: true },
  });
  if (!home) return res.status(404).json({ error: 'HOME_NOT_FOUND' });

  const count = await prisma.room.count({
    where: { id: { in: roomIds }, homeId },
  });
  if (count !== roomIds.length) {
    return res.status(400).json({ error: 'ROOMS_NOT_IN_HOME' });
  }

  await prisma.$transaction(
    roomIds.map((id: string, idx: number) =>
      prisma.room.update({ where: { id }, data: { position: idx } })
    )
  );

  res.json({ ok: true });
});
