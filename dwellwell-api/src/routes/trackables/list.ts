//dwellwell-api/src/routes/trackables/list.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import { getTrackableDisplay } from "../../services/trackables/display";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const homeId = (req.query.homeId as string) || undefined;
  const where: any = { ownerUserId: userId };
  if (homeId) where.homeId = homeId;

  const rows = await prisma.trackable.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      applianceCatalog: true,
      room: true,
      home: true,
    },
  });

  // Build responses in parallel so we can await display names
  const trackables = await Promise.all(
    rows.map(async (t) => {
      const type = t.kind ?? t.applianceCatalog?.type ?? null;
      const category = t.category ?? t.applianceCatalog?.category ?? "general";

      const display = await getTrackableDisplay(t.id);

      return {
        id: t.id,
        userDefinedName: t.userDefinedName ?? "",
        displayName: display.composedItemName, // 👈 preferred name to show

        // Prefer overrides on Trackable first, fallback to catalog
        brand: t.brand ?? t.applianceCatalog?.brand ?? null,
        model: t.model ?? t.applianceCatalog?.model ?? null,
        type,
        category,

        serialNumber: t.serialNumber ?? null,
        imageUrl: t.imageUrl ?? null,
        notes: t.notes ?? null,
        applianceCatalogId: t.applianceCatalogId ?? null,

        homeId: t.homeId ?? null,
        roomId: t.roomId ?? null,
        roomName: t.room?.name ?? null,
        homeName: t.home?.nickname ?? null,

        status: t.status,
        nextDueDate: (t as any).nextDueDate ?? null,
        counts: (t as any).counts ?? { overdue: 0, dueSoon: 0, active: 0 },

        createdAt: t.createdAt.toISOString(),
        lastCompletedAt: (t as any).lastCompletedAt ?? null,
      };
    })
  );

  res.json(trackables);
});
