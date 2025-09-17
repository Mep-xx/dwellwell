//dwellwell-api/src/routes/lookup/appliances.ts
import { Request, Response, Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim() || '';
  if (!q || q.length < 3) return res.json([]);
  const tokens = q.split(/\s+/).filter(Boolean);

  const rows = await prisma.applianceCatalog.findMany({
    where: {
      AND: tokens.map((t) => ({
        OR: [
          { brand: { contains: t, mode: 'insensitive' } },
          { model: { contains: t, mode: 'insensitive' } },
          { type: { contains: t, mode: 'insensitive' } },
          { category: { contains: t, mode: 'insensitive' } },
        ],
      })),
    },
    take: 8,
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    select: { brand: true, model: true, type: true, category: true, imageUrl: true, notes: true },
  });

  res.json(rows);
}));

export default router;