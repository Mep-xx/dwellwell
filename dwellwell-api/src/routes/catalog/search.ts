//dwellwell-api/src/routes/catalog/search.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim() || '';
  const take = Math.min(Number(req.query.take ?? 8), 25);
  if (!q) return res.json([]);

  const tokens = q.split(/\s+/).filter(Boolean);

  const rows = await prisma.applianceCatalog.findMany({
    where: {
      AND: tokens.map((t) => ({
        OR: [
          { brand: { contains: t, mode: 'insensitive' } },
          { model: { contains: t, mode: 'insensitive' } },
          { type: { contains: t, mode: 'insensitive' } },
          { category: { contains: t, mode: 'insensitive' } }, // NEW
        ],
      })),
    },
    take,
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    select: { id: true, brand: true, model: true, type: true, category: true, imageUrl: true, notes: true },
  });

  res.json(rows);
});
