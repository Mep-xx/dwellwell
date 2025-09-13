import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const homeId = (req.query.homeId as string) || undefined;

  // Only return the current user's trackables; optionally filter by current home pointer
  const where: any = { ownerUserId: userId };
  if (homeId) where.homeId = homeId;

  const rows = await prisma.trackable.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { applianceCatalog: true },
  });

  const trackables = rows.map((t) => ({
    id: t.id,
    userDefinedName: t.userDefinedName ?? '',
    brand: t.applianceCatalog?.brand ?? '',
    model: t.applianceCatalog?.model ?? '',
    type: t.applianceCatalog?.type ?? (t.kind ?? ''),
    category: t.applianceCatalog?.category ?? 'general',
    serialNumber: t.serialNumber ?? undefined,
    imageUrl: t.imageUrl ?? undefined,
    notes: t.notes ?? undefined,
    applianceCatalogId: t.applianceCatalogId ?? undefined,
    homeId: t.homeId ?? undefined,
    roomId: t.roomId ?? undefined,
    createdAt: t.createdAt.toISOString(),
    status: t.status,
  }));

  res.json(trackables);
});
