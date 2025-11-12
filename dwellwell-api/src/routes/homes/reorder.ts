// dwellwell-api/src/routes/homes/reorder.ts
import { Request, Response, Router } from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.put('/reorder', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const { homeIds } = (req.body ?? {}) as { homeIds?: string[] };

  if (!Array.isArray(homeIds) || homeIds.length === 0) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      details: { homeIds: Array.isArray(homeIds) && homeIds.length > 0 },
    });
  }

  const owned = await prisma.home.findMany({
    where: { userId, id: { in: homeIds } },
    select: { id: true },
  });

  const ownedSet = new Set(owned.map((h: { id: string }) => h.id));
  if (!homeIds.every((id) => ownedSet.has(id))) {
    return res.status(403).json({ error: 'FORBIDDEN' });
  }

  await prisma.$transaction(
    homeIds.map((id: string, idx: number) =>
      prisma.home.update({ where: { id }, data: { position: idx } })
    )
  );

  res.json({ ok: true });
});

export default router;
