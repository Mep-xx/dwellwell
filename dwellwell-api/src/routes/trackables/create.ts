import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import { Prisma } from "@prisma/client";
import { seedTasksForTrackable } from "./_seedTasks";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const {
    homeId,
    roomId,
    applianceCatalogId,
    userDefinedName,
    purchaseDate,
    serialNumber,
    notes,
    imageUrl,

    // overrides
    brand,
    model,
    type,      // UI "type" -> Trackable.kind
    category,  // Trackable.category
  } = req.body ?? {};

  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  if (!userDefinedName || typeof userDefinedName !== "string") {
    return res.status(400).json({ error: "NAME_REQUIRED" });
  }

  if (homeId) {
    const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!home) return res.status(400).json({ error: "HOME_NOT_FOUND_OR_NOT_OWNED" });
    if (roomId) {
      const room = await prisma.room.findFirst({ where: { id: roomId, homeId } });
      if (!room) return res.status(400).json({ error: "ROOM_NOT_FOUND_OR_NOT_IN_HOME" });
    }
  }

  if (applianceCatalogId) {
    const exists = await prisma.applianceCatalog.findUnique({ where: { id: applianceCatalogId } });
    if (!exists) return res.status(400).json({ error: "CATALOG_ID_INVALID" });
  }

  const data: any = {
    ownerUserId: userId,
    userDefinedName: userDefinedName.trim(),
  };

  if (homeId !== undefined) data.homeId = homeId;
  if (roomId !== undefined) data.roomId = roomId;
  if (applianceCatalogId !== undefined) data.applianceCatalogId = applianceCatalogId;

  if (serialNumber !== undefined) data.serialNumber = String(serialNumber || "").trim() || null;
  if (notes !== undefined) data.notes = String(notes || "").trim() || null;
  if (imageUrl !== undefined) data.imageUrl = String(imageUrl || "").trim() || null;

  // overrides (nullable columns on Trackable)
  if (brand !== undefined) data.brand = (brand && String(brand).trim()) || null;
  if (model !== undefined) data.model = (model && String(model).trim()) || null;
  if (type !== undefined) data.kind = (type && String(type).trim().toLowerCase()) || null;
  if (category !== undefined) data.category = (category && String(category).trim().toLowerCase()) || null;

  if (purchaseDate) {
    const d = new Date(purchaseDate);
    if (isNaN(d.getTime())) return res.status(400).json({ error: "INVALID_DATE", field: "purchaseDate" });
    data.purchaseDate = d;
  }

  const tenSecondsAgo = new Date(Date.now() - 10_000);
  const dup = await prisma.trackable.findFirst({
    where: {
      ownerUserId: userId,
      userDefinedName: userDefinedName.trim(),
      // optional tighten: brand/model/type/category match when provided
      ...(brand ? { brand: String(brand).trim() } : {}),
      ...(model ? { model: String(model).trim() } : {}),
      createdAt: { gt: tenSecondsAgo },
    },
  });
  if (dup) {
    // If tasks weren’t seeded (e.g., first run crashed) you could seed here too.
    return res.status(200).json(dup); // treat as idempotent
  }

  const created = await prisma.trackable.create({ data });

  // Seed tasks from ApplianceTaskTemplate if we have a catalog link
  try {
    await seedTasksForTrackable({
      prisma,
      userId,
      trackableId: created.id,
      applianceCatalogId: created.applianceCatalogId ?? null,
    });
  } catch (e) {
    // non-fatal; log and move on
    console.error("[trackables/create] seedTasks error:", e);
  }

  res.status(201).json(created);
});
