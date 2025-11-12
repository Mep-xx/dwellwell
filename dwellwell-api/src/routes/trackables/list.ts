//dwellwell-api/src/routes/trackables/list.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";
import { getTrackableDisplay } from "../../services/trackables/display";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const homeId = (req.query.homeId as string) || undefined;
  const scope = (req.query.scope as string) || undefined;
  let roomIdParam = req.query.roomId as string | undefined;

  const roomIdFilter =
    roomIdParam === "null" || roomIdParam === "" ? null : roomIdParam || undefined;

  const where: any = { ownerUserId: userId };
  if (homeId) where.homeId = homeId;
  if (scope === "home") {
    where.roomId = null;
  } else if (roomIdFilter !== undefined) {
    where.roomId = roomIdFilter;
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

  const trackableIds = rows.map((r: any) => r.id);
  if (trackableIds.length === 0) {
    return res.json([]);
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { defaultDaysBeforeDue: true },
  });
  const leadDays = settings?.defaultDaysBeforeDue ?? 7;

  const now = new Date();
  const soon = new Date(now.getTime() + leadDays * 24 * 60 * 60 * 1000);

  const whereBase = {
    userId,
    trackableId: { in: trackableIds },
    archivedAt: null as any,
    isTracking: true,
  };

  const activeCounts = await prisma.userTask.groupBy({
    by: ["trackableId"],
    where: { ...whereBase, status: "PENDING" },
    _count: { _all: true },
  });

  const overdueCounts = await prisma.userTask.groupBy({
    by: ["trackableId"],
    where: { ...whereBase, status: "PENDING", dueDate: { lt: now } },
    _count: { _all: true },
  });

  const dueSoonCounts = await prisma.userTask.groupBy({
    by: ["trackableId"],
    where: { ...whereBase, status: "PENDING", dueDate: { gte: now, lte: soon } },
    _count: { _all: true },
  });

  const nextDue = await prisma.userTask.groupBy({
    by: ["trackableId"],
    where: { ...whereBase, status: "PENDING" },
    _min: { dueDate: true },
  });

  const lastCompleted = await prisma.userTask.groupBy({
    by: ["trackableId"],
    where: { ...whereBase, status: "COMPLETED", completedDate: { not: null } },
    _max: { completedDate: true },
  });

  const mapCount = (
    arr: { trackableId: string | null; _count: { _all: number } }[]
  ) => new Map(arr.filter(r => r.trackableId)
                 .map((r) => [r.trackableId as string, r._count._all]));

  const mapMinDate = (
    arr: { trackableId: string | null; _min: { dueDate: Date | null } }[]
  ) =>
    new Map(
      arr.filter(r => r.trackableId)
         .map((r) => [r.trackableId as string, r._min.dueDate?.toISOString() ?? null])
    );

  const mapMaxDate = (
    arr: { trackableId: string | null; _max: { completedDate: Date | null } }[]
  ) =>
    new Map(
      arr.filter(r => r.trackableId)
         .map((r) => [r.trackableId as string, r._max.completedDate?.toISOString() ?? null])
    );

  const activeMap = mapCount(activeCounts);
  const overdueMap = mapCount(overdueCounts);
  const dueSoonMap = mapCount(dueSoonCounts);
  const nextDueMap = mapMinDate(nextDue);
  const lastCompletedMap = mapMaxDate(lastCompleted);

  const trackables = await Promise.all(
    rows.map(async (t: any) => {
      const type = t.kind ?? t.applianceCatalog?.type ?? null;
      const category = t.category ?? t.applianceCatalog?.category ?? "general";
      const display = await getTrackableDisplay(t.id);

      const counts = {
        overdue: overdueMap.get(t.id) ?? 0,
        dueSoon: dueSoonMap.get(t.id) ?? 0,
        active: activeMap.get(t.id) ?? 0,
      };

      return {
        id: t.id,
        userDefinedName: t.userDefinedName ?? "",
        displayName: display.composedItemName,
        name: display.composedItemName,

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

        nextDueDate: nextDueMap.get(t.id) ?? null,
        counts,

        createdAt: t.createdAt.toISOString(),
        lastCompletedAt: lastCompletedMap.get(t.id) ?? null,
      };
    })
  );

  res.json(trackables);
});
