import { Router, Request, Response } from "express";
import { prisma } from '../../db/prisma';
import { requireAuth } from "../../middleware/requireAuth";
import { createHomeSchema } from "./schema";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = createHomeSchema.parse(req.body);

  const created = await prisma.home.create({
    data: {
      ...data,
      userId,
    },
  });

  res.status(201).json(created);
});

export default router;
