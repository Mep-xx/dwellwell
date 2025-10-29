import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();
router.use(requireAuth, requireAdmin);

/** Narrow unions for sorting */
type SortField = 'createdAt';
type SortDir = 'asc' | 'desc';

/** Selected shape from prisma.home */
type HomeRow = {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  userId: string | null;
};

/** Owner records we load separately */
type OwnerRow = { id: string; email: string };

/** groupBy(HomeId) shapes */
type RoomGroup = { homeId: string | null; _count: { _all: number } };
type TrackableGroup = { homeId: string | null; _count: { _all: number } };

/** Case-insensitive literal */
type Insensitive = 'insensitive';
const INSENSITIVE: Insensitive = 'insensitive';

/** Separate the OR object from the union to avoid HomeWhere['OR'] error */
type HomeWhereOrObject = {
  OR: Array<
    | { address: { contains: string; mode: Insensitive } }
    | { city: { contains: string; mode: Insensitive } }
    | { state: { contains: string; mode: Insensitive } }
    | { userId: { in: string[] } }
  >;
};
type HomeWhere = undefined | HomeWhereOrObject;

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

    // Strict sort parsing
    const [sortFieldRaw, sortDirRaw] = String(sort).split(':');
    const sortField: SortField = sortFieldRaw === 'createdAt' ? 'createdAt' : 'createdAt';
    const sortDir: SortDir = sortDirRaw === 'asc' ? 'asc' : 'desc';
    const orderBy: Array<Record<SortField, SortDir>> = [{ [sortField]: sortDir }];

    const needle = q?.trim();

    // If searching by email, collect candidate userIds
    let candidateUserIds: string[] | undefined;
    if (needle) {
      const users = await prisma.user.findMany({
        where: { email: { contains: needle, mode: INSENSITIVE } },
        select: { id: true },
      });
      // 🔧 annotate the callback param to avoid implicit any
      candidateUserIds = users.map((u: { id: string }) => u.id);
    }

    // Build a strict HomeWhere (no any)
    let where: HomeWhere;
    if (needle) {
      const orClauses: HomeWhereOrObject['OR'] = [
        { address: { contains: needle, mode: INSENSITIVE } },
        { city:    { contains: needle, mode: INSENSITIVE } },
        { state:   { contains: needle, mode: INSENSITIVE } },
      ];
      if (candidateUserIds && candidateUserIds.length > 0) {
        orClauses.push({ userId: { in: candidateUserIds } });
      }
      where = { OR: orClauses };
    }

    // Count + page load (typed)
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

    const homes: HomeRow[] = itemsRaw as HomeRow[];

    const homeIds: string[] = homes.map((h) => h.id);
    const userIds: string[] = Array.from(
      new Set(homes.map((h) => h.userId).filter((v): v is string => Boolean(v)))
    );

    // Aggregates & owners
    const [roomGroupsRaw, trackableGroupsRaw, ownersRaw] = await Promise.all([
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
        : Promise.resolve([] as OwnerRow[]),
    ]);

    const roomGroups: RoomGroup[] = roomGroupsRaw as RoomGroup[];
    const trackableGroups: TrackableGroup[] = trackableGroupsRaw as TrackableGroup[];
    const owners: OwnerRow[] = ownersRaw as OwnerRow[];

    // Build lookup maps (typed)
    const roomCountMap = new Map<string, number>();
    for (const r of roomGroups) {
      if (r.homeId) roomCountMap.set(r.homeId, r._count._all);
    }

    const trackableCountMap = new Map<string, number>();
    for (const t of trackableGroups) {
      if (t.homeId) trackableCountMap.set(t.homeId, t._count._all);
    }

    const ownerMap = new Map<string, OwnerRow>();
    for (const o of owners) {
      ownerMap.set(o.id, o);
    }

    const items = homes.map((h) => ({
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
    // eslint-disable-next-line no-console
    console.error('GET /api/admin/homes failed:', err);
    res.status(500).json({ message: 'Failed to fetch homes' });
  }
});

export default router;
