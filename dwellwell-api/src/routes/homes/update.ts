// dwellwell-api/src/routes/homes/update.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import { generateTasksFromTemplatesForHome } from "../../services/taskgen/fromTemplates";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { homeId } = req.params as any;

  const before = await prisma.home.findFirst({ where: { id: homeId, userId } });
  if (!before) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  const {
    nickname, squareFeet, lotSize, yearBuilt,
    hasCentralAir, hasBaseboard, hasHeatPump,
    roofType, sidingType, architecturalStyle, numberOfRooms,
    features, imageUrl, latitude, longitude, timeZone, position,
  } = req.body ?? {};

  const updated = await prisma.home.update({
    where: { id: homeId },
    data: {
      ...(nickname !== undefined ? { nickname } : {}),
      ...(squareFeet !== undefined ? { squareFeet } : {}),
      ...(lotSize !== undefined ? { lotSize } : {}),
      ...(yearBuilt !== undefined ? { yearBuilt } : {}),
      ...(hasCentralAir !== undefined ? { hasCentralAir } : {}),
      ...(hasBaseboard !== undefined ? { hasBaseboard } : {}),
      ...(hasHeatPump !== undefined ? { hasHeatPump } : {}),
      ...(roofType !== undefined ? { roofType } : {}),
      ...(sidingType !== undefined ? { sidingType } : {}),
      ...(architecturalStyle !== undefined ? { architecturalStyle } : {}),
      ...(numberOfRooms !== undefined ? { numberOfRooms } : {}),
      ...(Array.isArray(features) ? { features } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
      ...(timeZone !== undefined ? { timeZone } : {}),
      ...(position !== undefined ? { position } : {}),
    },
  });

  // Only kick taskgen when relevant flags changed (keeps it efficient)
  const hvacChanged =
    before.hasCentralAir !== updated.hasCentralAir ||
    before.hasHeatPump !== updated.hasHeatPump;

  const roofChanged   = before.roofType   !== updated.roofType;
  const sidingChanged = before.sidingType !== updated.sidingType;

  const shouldRegen = hvacChanged || roofChanged || sidingChanged;

  if (shouldRegen) {
    try {
      await generateTasksFromTemplatesForHome(updated.id);
    } catch (e) {
      console.error("[homes/update] taskgen error:", e);
    }
  }

  res.json(updated);
});
