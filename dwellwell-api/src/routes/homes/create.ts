// dwellwell-api/src/routes/homes/create.ts
import { Router, Request, Response } from "express";
import { prisma } from '../../db/prisma';
import { requireAuth } from "../../middleware/requireAuth";
import { createHomeSchema } from "./schema";
import { generateTasksForHomeBasics } from "../../services/taskgen";
import { generateTasksForAllRooms } from "../../services/taskgen/generateAllRooms";

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

  // Immediately kick off task generation:
  // - Home-level rules
  // - Room-level rules for any rooms that were auto-seeded on creation
  (async () => {
    try {
      await generateTasksForHomeBasics(created.id);
    } catch (e) {
      console.error("generateTasksForHomeBasics on create failed:", e);
    }
    try {
      await generateTasksForAllRooms(created.id);
    } catch (e) {
      console.error("generateTasksForAllRooms on create failed:", e);
    }
  })();

  res.status(201).json(created);
});

export default router;
