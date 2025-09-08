// dwellwell-api/src/routes/rooms/list.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;

  if ('propertyId' in req.query) {
    return res.status(400).json({ error: 'DO_NOT_USE_PROPERTY_ID' });
  }

  const homeId = (req.query.homeId as string) || '';
  const includeDetails = String(req.query.includeDetails || 'false') === 'true';
  if (!homeId) return res.status(400).json({ error: 'HOME_ID_REQUIRED' });

  const rooms = await prisma.room.findMany({
    where: { homeId, home: { userId } },
    orderBy: [{ position: 'asc' }],
    include: includeDetails ? { detail: true } : undefined,
  });

  res.json(rooms);
});
