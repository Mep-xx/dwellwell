import { Router } from 'express';
import { prisma } from '../../db/prisma';

const router = Router();

/**
 * GET /api/lookup/appliances?q=Bosch
 * DB-first suggestions from ApplianceCatalog.
 * Returns: Array<{brand, model, type, category, imageUrl?, notes?}>
 */
router.get('/appliances', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);

  // Very light fuzzy-ish search across brand/model/type
  const rows = await prisma.applianceCatalog.findMany({
    where: {
      OR: [
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { type:  { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: { brand: 'asc' },
  });

  const out = rows.map(r => ({
    brand: r.brand ?? '',
    model: r.model ?? '',
    type: r.type ?? '',
    category: r.category ?? 'general',
    imageUrl: r.imageUrl ?? undefined,
    notes: undefined,
  }));

  res.json(out);
});

export default router;
