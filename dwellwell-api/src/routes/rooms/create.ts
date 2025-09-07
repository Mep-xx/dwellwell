import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const body = req.body ?? {};

  if ('propertyId' in body) {
    return res.status(400).json({ error: 'DO_NOT_USE_PROPERTY_ID' });
  }

  const { homeId, type, name } = body;
  const floor =
    body.floor === undefined || body.floor === null || body.floor === ''
      ? null
      : Number(body.floor);

  if (!homeId || !type) {
    return res.status(400).json({
      error: 'VALIDATION_FAILED',
      details: { homeId: !!homeId, type: !!type },
    });
  }
  if (floor !== null && Number.isNaN(floor)) {
    return res.status(400).json({ error: 'INVALID_FLOOR', details: { floor: body.floor } });
  }

  // Verify ownership of Home
  const home = await prisma.home.findFirst({
    where: { id: homeId, userId },
    select: { id: true },
  });
  if (!home) return res.status(404).json({ error: 'HOME_NOT_FOUND' });

  // Next position within this home's rooms
  const last = await prisma.room.findFirst({
    where: { homeId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const room = await prisma.room.create({
    data: {
      homeId,
      type,
      name: name ?? type,
      floor: floor ?? undefined,
      position: (last?.position ?? -1) + 1,
    },
  });

  res.status(201).json(room);
});
