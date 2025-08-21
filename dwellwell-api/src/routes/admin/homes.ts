import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

// If you have auth/role guards, enable them here
// import { requireAuth } from '../../middleware/requireAuth';
// import { requireAdmin } from '../../middleware/requireAdmin';
// router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/homes
 * Query:
 *  - q?: string (search across address/city/state and owner email)
 *  - page?: number (default 1)
 *  - pageSize?: number (default 25, max 100)
 *  - sort?: 'createdAt:desc' | 'createdAt:asc' (default: createdAt:desc)
 *
 * Response:
 * {
 *   page, pageSize, total, totalPages,
 *   items: [{
 *     id, address, city, state, createdAt,
 *     user: { id, email } | null,
 *     roomsCount, trackablesCount
 *   }]
 * }
 */
router.get('/', async (req, res) => {
  try {
    const {
      q,
      page = '1',
      pageSize = '25',
      sort = 'createdAt:desc',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize || '25', 10) || 25, 1), 100);
    const skip = (pageNum - 1) * size;

    // Sort
    let orderBy: Prisma.HomeOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort) {
      const [field, dir] = String(sort).split(':');
      if (['createdAt'].includes(field) && ['asc', 'desc'].includes(dir)) {
        orderBy = { [field]: dir as Prisma.SortOrder };
      }
    }

    const needle = q?.trim();
    const insensitive = Prisma.QueryMode.insensitive;

    // If the search includes owner email, we need candidate userIds first.
    let candidateUserIds: string[] | undefined;
    if (needle) {
      const users = await prisma.user.findMany({
        where: { email: { contains: needle, mode: insensitive } },
        select: { id: true },
      });
      candidateUserIds = users.map(u => u.id);
    }

    // Build Home where clause WITHOUT unknown fields/relations
    let where: Prisma.HomeWhereInput | undefined;
    if (needle) {
      where = {
        OR: [
          { address: { contains: needle, mode: insensitive } },
          { city: { contains: needle, mode: insensitive } },
          { state: { contains: needle, mode: insensitive } },
          ...(candidateUserIds && candidateUserIds.length > 0
            ? [{ userId: { in: candidateUserIds } } as Prisma.HomeWhereInput]
            : []),
        ],
      };
    }

    // Total & page items
    const [total, itemsRaw] = await Promise.all([
      prisma.home.count({ where }),
      prisma.home.findMany({
        where,
        orderBy,
        skip,
        take: size,
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          createdAt: true,
          userId: true,
        },
      }),
    ]);

    const homeIds = itemsRaw.map((h) => h.id);
    const userIds = Array.from(new Set(itemsRaw.map((h) => h.userId).filter(Boolean))) as string[];

    // Per‑home counts
    const [roomCounts, trackableCounts, owners] = await Promise.all([
      prisma.room.groupBy({
        by: ['homeId'],
        _count: { _all: true },
        where: { homeId: { in: homeIds } },
      }),
      prisma.trackable.groupBy({
        by: ['homeId'],
        _count: { _all: true },
        where: { homeId: { in: homeIds } },
      }),
      userIds.length
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true },
          })
        : Promise.resolve([] as { id: string; email: string }[]),
    ]);

    const roomCountMap = new Map<string, number>(
      roomCounts.map((r) => [r.homeId, r._count._all])
    );
    const trackableCountMap = new Map<string, number>(
      trackableCounts.map((t) => [t.homeId, t._count._all])
    );
    const ownerMap = new Map<string, { id: string; email: string }>(
      owners.map((o) => [o.id, o])
    );

    const items = itemsRaw.map((h) => ({
      id: h.id,
      address: h.address,
      city: h.city,
      state: h.state,
      createdAt: h.createdAt,
      user: h.userId ? ownerMap.get(h.userId) ?? null : null,
      roomsCount: roomCountMap.get(h.id) ?? 0,
      trackablesCount: trackableCountMap.get(h.id) ?? 0,
    }));

    res.json({
      page: pageNum,
      pageSize: size,
      total,
      totalPages: Math.max(Math.ceil(total / size), 1),
      items,
    });
  } catch (err) {
    console.error('GET /api/admin/homes failed:', err);
    res.status(500).json({ message: 'Failed to fetch homes' });
  }
});

export default router;
