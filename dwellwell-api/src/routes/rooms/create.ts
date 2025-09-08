import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const body = req.body ?? {};

  if ('propertyId' in body) return res.status(400).json({ error: 'DO_NOT_USE_PROPERTY_ID' });

  const { homeId, type, name, floor, details } = body;
  const floorNum =
    floor === undefined || floor === null || floor === '' ? null : Number(floor);

  if (!homeId || !type) {
    return res.status(400).json({
      error: 'VALIDATION_FAILED',
      details: { homeId: !!homeId, type: !!type },
    });
  }
  if (floorNum !== null && Number.isNaN(floorNum)) {
    return res.status(400).json({ error: 'INVALID_FLOOR', details: { floor } });
  }

  const home = await prisma.home.findFirst({ where: { id: homeId, userId }, select: { id: true } });
  if (!home) return res.status(404).json({ error: 'HOME_NOT_FOUND' });

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
      floor: floorNum ?? undefined,
      position: (last?.position ?? -1) + 1,
      detail: details && typeof details === 'object'
        ? { create: { ...details } }
        : { create: {} },
    },
    include: { detail: true },
  });

  res.status(201).json(room);
});