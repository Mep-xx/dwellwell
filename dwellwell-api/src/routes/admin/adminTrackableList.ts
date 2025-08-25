// dwellwell-api/src/routes/admin/adminTrackableList.ts
import { Router } from 'express';
import { prisma } from '../../db/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const {
      q,
      type,
      category,
      userId,
      homeId,
      page = '1',
      pageSize = '25',
      sort = 'createdAt:desc',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize || '25', 10) || 25, 1), 100);
    const skip = (pageNum - 1) * size;

    // orderBy
    let orderBy: any = { createdAt: 'desc' as const };
    if (sort) {
      const [field, dir] = String(sort).split(':');
      if (['createdAt'].includes(field) && ['asc', 'desc'].includes(dir)) {
        orderBy = { [field]: dir };
      }
    }

    // where
    const where: any = {};
    if (homeId) where.homeId = homeId;
    if (userId) where.home = { userId }; // via Home relation

    if (type) {
      where.applianceCatalog = { ...(where.applianceCatalog || {}), type };
    }
    if (category) {
      where.applianceCatalog = { ...(where.applianceCatalog || {}), category };
    }

    if (q && q.trim()) {
      const needle = q.trim();
      where.OR = [
        { userDefinedName: { contains: needle, mode: 'insensitive' } },
        { serialNumber: { contains: needle, mode: 'insensitive' } },
        { applianceCatalog: { brand: { contains: needle, mode: 'insensitive' } } },
        { applianceCatalog: { model: { contains: needle, mode: 'insensitive' } } },
      ];
    }

    const [total, itemsRaw] = await Promise.all([
      prisma.trackable.count({ where }),
      prisma.trackable.findMany({
        where,
        orderBy,
        skip,
        take: size,
        select: {
          id: true,
          createdAt: true,
          imageUrl: true,
          serialNumber: true,
          userDefinedName: true,
          home: {
            select: {
              id: true,
              address: true,
              city: true,
              state: true,
              user: { select: { id: true, email: true } },
            },
          },
          applianceCatalog: {
            select: { brand: true, model: true, type: true, category: true },
          },
        },
      }),
    ]);

    // resource counts via groupBy (works even if Trackable.resources relation is missing)
    const resourceCounts = await prisma.trackableResource.groupBy({
      by: ['trackableId'],
      _count: { _all: true },
      where: { trackableId: { in: itemsRaw.map(i => i.id) } },
    });
    const countMap = new Map(resourceCounts.map(rc => [rc.trackableId, rc._count._all]));

    const items = itemsRaw.map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      imageUrl: t.imageUrl,
      serialNumber: t.serialNumber,
      userDefinedName: t.userDefinedName,
      brand: t.applianceCatalog?.brand ?? null,
      model: t.applianceCatalog?.model ?? null,
      type: t.applianceCatalog?.type ?? null,
      category: t.applianceCatalog?.category ?? null,
      home: {
        id: t.home.id,
        address: t.home.address,
        city: t.home.city,
        state: t.home.state,
      },
      user: t.home.user,
      resourceCount: countMap.get(t.id) ?? 0,
    }));

    res.json({
      page: pageNum,
      pageSize: size,
      total,
      totalPages: Math.max(Math.ceil(total / size), 1),
      sort: orderBy,
      items,
    });
  } catch (err: any) {
    console.error('Failed to list admin trackables:', err);
    res.status(500).json({ error: 'Failed to fetch trackables' });
  }
});

export default router;
