import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { prisma } from '../../db/prisma';

const router = Router();
router.use(requireAuth);

router.get('/appliances', async (req, res) => {
  const query = (req.query.q as string) || '';
  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'QUERY_TOO_SHORT' });
  }

  const results = await prisma.applianceCatalog.findMany({
    where: {
      OR: [
        { brand: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
        { type:  { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
  });

  res.json(results);
});

export default router;
