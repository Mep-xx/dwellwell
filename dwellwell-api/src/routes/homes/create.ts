// dwellwell-api/src/routes/homes/create.ts
import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";
import { createHomeSchema } from "./schema";
import { generateTasksForHomeBasics, generateTasksForRoom } from "../../services/taskgen";

const router = Router();

/**
 * Create a home, then immediately seed home-scoped tasks.
 * If your bootstrap also pre-creates rooms (in DB triggers or elsewhere),
 * we’ll generate room-scoped tasks for any rooms that already exist.
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = createHomeSchema.parse(req.body);

  const created = await prisma.home.create({
    data: {
      ...data,
      userId,
    },
  });

  // Idempotent: rules dedupe downstream
  try {
    await generateTasksForHomeBasics(created.id);

    // If any rooms already exist (unlikely right after create, but harmless):
    const rooms = await prisma.room.findMany({ where: { homeId: created.id } });
    if (rooms.length) {
      await Promise.all(rooms.map((r) => generateTasksForRoom(r.id)));
    }
  } catch (err) {
    // Don’t block creation on taskgen problems; surface in logs/admin table instead
    console.error("[homes/create] taskgen error:", err);
  }

  res.status(201).json(created);
});

export default router;
