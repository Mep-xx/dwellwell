//dwellwell-api/src/routes/homes/remove.ts

import { Router, Request, Response } from "express";
import { prisma } from '../../db/prisma';
import { requireAuth } from "../../middleware/requireAuth";
import { homeIdParam } from "./schema";

const router = Router();

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = homeIdParam.parse(req.params);
  const userId = req.user!.id;

  const existing = await prisma.home.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  await prisma.home.delete({ where: { id } });
  res.status(204).send();
});

export default router;
