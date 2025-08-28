//dwellwell-api/src/routes/homes/summary.ts
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

  // You can tailor this however you like:
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
  });
});

export default router;
