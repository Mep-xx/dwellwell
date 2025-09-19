// dwellwell-api/src/routes/homes/summary.ts
import { Router, Request, Response } from "express";
import { prisma } from '../../db/prisma';
import { requireAuth } from "../../middleware/requireAuth";
import { homeIdParam } from "./schema";

const router = Router();

router.get("/:id/summary", requireAuth, async (req: Request, res: Response) => {
  const { id } = homeIdParam.parse(req.params);
  const userId = req.user!.id;

  const home = await prisma.home.findFirst({
    where: { id, userId },
    include: {
      rooms: true,
      vehicles: true,
      trackables: true,
    },
  });

  if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  // ----- Maintenance task summary (done / dueSoon / overdue / total)
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // All tasks that are tied to this home via room.homeId or trackable.homeId
  const tasks = await prisma.userTask.findMany({
    where: {
      userId,
      OR: [
        { room: { homeId: id } },
        { trackable: { homeId: id } },
      ],
    },
    select: { status: true, completedDate: true, dueDate: true },
  });

  let complete = 0, dueSoon = 0, overdue = 0, total = tasks.length;
  for (const t of tasks) {
    const isDone = t.status === 'COMPLETED';
    if (isDone) { complete++; continue; }
    if (t.dueDate && t.dueDate < now) overdue++;
    else if (t.dueDate && t.dueDate >= now && t.dueDate < soon) dueSoon++;
  }

  res.json({
    id: home.id,
    nickname: home.nickname ?? home.address,
    address: [home.address, home.apartment].filter(Boolean).join(", "),
    city: home.city,
    state: home.state,
    zip: home.zip,
    squareFeet: home.squareFeet ?? null,
    yearBuilt: home.yearBuilt ?? null,
    hasCentralAir: home.hasCentralAir ?? false,
    hasBaseboard: home.hasBaseboard ?? false,
    features: home.features ?? [],
    counts: {
      rooms: home.rooms.length,
      vehicles: home.vehicles.length,
      trackables: home.trackables.length,
    },
    taskSummary: { complete, dueSoon, overdue, total },
  });
});

export default router;
