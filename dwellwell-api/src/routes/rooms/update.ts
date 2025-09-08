// dwellwell-api/src/routes/rooms/update.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';

export default asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const { roomId } = req.params as any;

  if ('propertyId' in (req.body ?? {})) {
    return res.status(400).json({ error: 'DO_NOT_USE_PROPERTY_ID' });
  }

  const existing = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });

  const body = req.body ?? {};
  const { details, ...base } = body;
  const data: any = {};

  if (base.type !== undefined) data.type = String(base.type);
  if (base.name !== undefined) data.name = String(base.name);

  if (base.floor !== undefined) {
    if (base.floor === null || base.floor === '') data.floor = null;
    else {
      const n = Number(base.floor);
      if (Number.isNaN(n)) return res.status(400).json({ error: 'INVALID_FLOOR', details: { floor: base.floor } });
      data.floor = n;
    }
  }
  if (base.position !== undefined) {
    const p = Number(base.position);
    if (Number.isNaN(p)) return res.status(400).json({ error: 'INVALID_POSITION' });
    data.position = p;
  }

  const updated = await prisma.room.update({
    where: { id: roomId },
    data,
  });

  if (details && typeof details === 'object') {
    await prisma.roomDetail.upsert({
      where: { roomId },
      create: { roomId, ...details },
      update: { ...details },
    });
  }

  // return with detail for convenience
  const withDetail = await prisma.room.findUnique({
    where: { id: roomId },
    include: { detail: true },
  });
  res.json(withDetail);
});
