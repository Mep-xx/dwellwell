// dwellwell-api/src/routes/rooms/update.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { roomId } = req.params as any;

  if ('propertyId' in (req.body ?? {})) {
    return res.status(400).json({ error: 'DO_NOT_USE_PROPERTY_ID' });
  }

  // Ensure the room belongs to the user's home
  const existing = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });

  const body = req.body ?? {};
  const data: any = {};

  if (body.type !== undefined) data.type = String(body.type);
  if (body.name !== undefined) data.name = String(body.name);

  if (body.floor !== undefined) {
    if (body.floor === null || body.floor === '') data.floor = null;
    else {
      const n = Number(body.floor);
      if (Number.isNaN(n)) {
        return res.status(400).json({ error: 'INVALID_FLOOR', details: { floor: body.floor } });
      }
      data.floor = n;
    }
  }

  if (body.position !== undefined) {
    const p = Number(body.position);
    if (Number.isNaN(p)) return res.status(400).json({ error: 'INVALID_POSITION' });
    data.position = p;
  }

  if (body.hasFireplace !== undefined) data.hasFireplace = !!body.hasFireplace;
  if (body.hasBoiler !== undefined) data.hasBoiler = !!body.hasBoiler;
  if (body.hasSmokeDetector !== undefined) data.hasSmokeDetector = !!body.hasSmokeDetector;

  const updated = await prisma.room.update({ where: { id: roomId }, data });
  res.json(updated);
});
