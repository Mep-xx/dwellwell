import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const homeId = (req.query.homeId as string) || undefined;

  const where: any = { ownerUserId: userId };
  if (homeId) where.homeId = homeId;

  const rows = await prisma.trackable.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      applianceCatalog: true,
      room: true,
      home: true,
    },
  });

  const trackables = rows.map((t) => {
    // Type is either stored on Trackable (kind) or in the catalog
    const type = t.kind ?? t.applianceCatalog?.type ?? null;
    // Category appears to only be in the catalog for your current schema
    const category = t.applianceCatalog?.category ?? 'general';

    return {
      id: t.id,
      userDefinedName: t.userDefinedName ?? '',

      // Brand/Model from catalog (since Trackable lacks these columns)
      brand: t.applianceCatalog?.brand ?? null,
      model: t.applianceCatalog?.model ?? null,
      type,
      category,

      // Fields that exist on Trackable
      serialNumber: t.serialNumber ?? null,
      imageUrl: t.imageUrl ?? null,
      notes: t.notes ?? null,
      applianceCatalogId: t.applianceCatalogId ?? null,

      homeId: t.homeId ?? null,
      roomId: t.roomId ?? null,
      roomName: t.room?.name ?? null,
      // Home doesn’t have "name"—use nickname instead
      homeName: t.home?.nickname ?? null,

      status: t.status,
      // These only exist if you compute/attach them elsewhere; keep null otherwise
      nextDueDate: (t as any).nextDueDate ?? null,
      counts: (t as any).counts ?? { overdue: 0, dueSoon: 0, active: 0 },

      createdAt: t.createdAt.toISOString(),
      lastCompletedAt: (t as any).lastCompletedAt ?? null,
      // Your Trackable doesn’t have pausedAt / retiredAt columns—omit them
      // pausedAt: null,
      // retiredAt: null,
    };
  });

  res.json(trackables);
});
