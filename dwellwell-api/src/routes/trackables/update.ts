import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  const current = await prisma.trackable.findFirst({
    where: { id: trackableId, home: { userId } }, // ownership via Home
    select: { id: true, homeId: true },
  });
  if (!current) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  const {
    homeId,
    roomId,
    applianceCatalogId,
    userDefinedName,
    purchaseDate,
    serialNumber,
    notes,
    imageUrl,
  } = req.body ?? {};

  const data: any = {};
  if (userDefinedName !== undefined) data.userDefinedName = userDefinedName;
  if (serialNumber !== undefined) data.serialNumber = serialNumber;
  if (notes !== undefined) data.notes = notes;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;

  if (purchaseDate !== undefined) {
    if (purchaseDate === null || purchaseDate === '') {
      data.purchaseDate = null;
    } else {
      const d = new Date(purchaseDate);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'INVALID_DATE', field: 'purchaseDate' });
      data.purchaseDate = d;
    }
  }

  if (applianceCatalogId !== undefined) {
    if (applianceCatalogId === null) {
      data.applianceCatalogId = null;
    } else {
      const exists = await prisma.applianceCatalog.findUnique({ where: { id: applianceCatalogId } });
      if (!exists) return res.status(400).json({ error: 'CATALOG_ID_INVALID' });
      data.applianceCatalogId = applianceCatalogId;
    }
  }

  // Reassigning home? Verify ownership and reset room if needed.
  if (homeId !== undefined && homeId !== current.homeId) {
    const newHome = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!newHome) return res.status(400).json({ error: 'HOME_NOT_FOUND_OR_NOT_OWNED' });
    data.homeId = homeId;
    // If caller didn't also provide a valid room in that home, clear roomId
    data.roomId = null;
  }

  // Changing/setting room? Verify that room belongs to the (possibly new) home
  const effectiveHomeId = data.homeId ?? current.homeId;
  if (roomId !== undefined) {
    if (roomId === null) {
      data.roomId = null;
    } else {
      const room = await prisma.room.findFirst({ where: { id: roomId, homeId: effectiveHomeId } });
      if (!room) return res.status(400).json({ error: 'ROOM_NOT_FOUND_OR_NOT_IN_HOME' });
      data.roomId = roomId;
    }
  }

  const updated = await prisma.trackable.update({ where: { id: trackableId }, data });
  res.json(updated);
});
