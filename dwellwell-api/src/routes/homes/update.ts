// dwellwell-api/src/routes/homes/update.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import { generateTasksForHomeBasics } from "../../services/taskgen";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { homeId } = req.params as any;

  const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
  if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  const {
    nickname, squareFeet, yearBuilt,
    hasCentralAir, hasBaseboard, hasHeatPump,
    roofType, sidingType, architecturalStyle, features,
  } = req.body ?? {};

  const updated = await prisma.home.update({
    where: { id: homeId },
    data: {
      ...(nickname !== undefined ? { nickname } : {}),
      ...(squareFeet !== undefined ? { squareFeet } : {}),
      ...(yearBuilt !== undefined ? { yearBuilt } : {}),
      ...(hasCentralAir !== undefined ? { hasCentralAir } : {}),
      ...(hasBaseboard !== undefined ? { hasBaseboard } : {}),
      ...(hasHeatPump !== undefined ? { hasHeatPump } : {}),
      ...(roofType !== undefined ? { roofType } : {}),
      ...(sidingType !== undefined ? { sidingType } : {}),
      ...(architecturalStyle !== undefined ? { architecturalStyle } : {}),
      ...(Array.isArray(features) ? { features } : {}),
    },
  });

  // 🔔 kick off (idempotent) task generation for home-level rules
  try { await generateTasksForHomeBasics(updated.id); } catch (e) { console.error(e); }

  res.json(updated);
});
