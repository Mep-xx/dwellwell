// dwellwell-api/src/routes/trackables/list.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import { getTrackableDisplay } from "../../services/trackables/display";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const homeId = (req.query.homeId as string) || undefined;
  const scope = (req.query.scope as string) || undefined;
  let roomIdParam = req.query.roomId as string | undefined;

  // Normalize "?roomId=null" and "?roomId=" to mean actual NULL
  const roomIdFilter =
    roomIdParam === "null" || roomIdParam === "" ? null : roomIdParam || undefined;

  // Base user filter
  const where: any = { ownerUserId: userId };

  // Home filter when provided
  if (homeId) where.homeId = homeId;

  // Scope handling
  // - scope=home => only trackables that are home-level (roomId IS NULL) for this home
  // - roomId=...  => explicit room filter
  // - roomId=null => same as scope=home (home-level)
  if (scope === "home") {
    where.roomId = null;
  } else if (roomIdFilter !== undefined) {
    where.roomId = roomIdFilter; // either a concrete id or null
  }

  const rows = await prisma.trackable.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      applianceCatalog: true,
      room: true,
      home: true,
    },
  });

  const trackables = await Promise.all(
    rows.map(async (t) => {
      const type = t.kind ?? t.applianceCatalog?.type ?? null;
      const category = t.category ?? t.applianceCatalog?.category ?? "general";
      const display = await getTrackableDisplay(t.id);

      return {
        id: t.id,

        // Names
        userDefinedName: t.userDefinedName ?? "",
        displayName: display.composedItemName,
        name: display.composedItemName, // ← for callers expecting `name`

        // Prefer per-item overrides, fallback to catalog
        brand: t.brand ?? t.applianceCatalog?.brand ?? null,
        model: t.model ?? t.applianceCatalog?.model ?? null,
        type,
        category,

        serialNumber: t.serialNumber ?? null,
        imageUrl: t.imageUrl ?? null,
        notes: t.notes ?? null,
        applianceCatalogId: t.applianceCatalogId ?? null,

        // Placement
        homeId: t.homeId ?? null,
        roomId: t.roomId ?? null,
        roomName: t.room?.name ?? null,
        homeName: t.home?.nickname ?? null,

        status: t.status,

        // Optional snapshot/aggregates (if you add them in the future)
        nextDueDate: (t as any).nextDueDate ?? null,
        counts: (t as any).counts ?? { overdue: 0, dueSoon: 0, active: 0 },

        createdAt: t.createdAt.toISOString(),
        lastCompletedAt: (t as any).lastCompletedAt ?? null,
      };
    })
  );

  res.json(trackables);
});
