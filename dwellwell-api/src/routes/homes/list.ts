// dwellwell-api/src/routes/homes/list.ts
import { Router, Request, Response } from "express";
import { prisma } from '../../db/prisma';
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const homes = await prisma.home.findMany({
    where: { userId },
    orderBy: [
      { position: 'asc' },     // manual order first (nulls sort last)
      { createdAt: 'desc' },   // newest first as default
    ],
  });
  res.json(homes);
});

export default router;
