// dwellwell-api/src/routes/tasks/list.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { prisma } from "../../db/prisma";

function parseStatus(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "completed") return "completed";
  if (v === "overdue") return "overdue";
  if (v === "duesoon" || v === "due_soon") return "dueSoon";
  return "active";
}

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const homeId = (req.query.homeId as string) || undefined;
  const roomId = (req.query.roomId as string) || undefined;
  const trackableId = (req.query.trackableId as string) || undefined;

  const statusQ = parseStatus(req.query.status as string | undefined);
  const limit = Math.max(
    1,
    Math.min(parseInt((req.query.limit as string) || "100", 10) || 100, 500)
  );
  const sort = (req.query.sort as string) || "dueDate"; // "-completedAt" for recent

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  // ---------- base (all queries) ----------
  const base: any = {
    userId,
    archivedAt: null,
  };

  // Status filter
  if (statusQ === "active") base.status = "PENDING";
  else if (statusQ === "completed") base.status = "COMPLETED";
  else if (statusQ === "overdue") {
    base.status = "PENDING";
    base.dueDate = { lt: now };
  } else if (statusQ === "dueSoon") {
    base.status = "PENDING";
    base.dueDate = { gte: now, lte: sevenDaysFromNow };
  }

  // ---------- scope filters ----------
  // Explicit room/trackable filters take precedence.
  if (roomId) base.roomId = roomId;
  if (trackableId) base.trackableId = trackableId;

  // Home filter: match ANY of…
  //   - task.homeId (NEW)
  //   - task.room.homeId
  //   - task.trackable.homeId
  const where =
    homeId && !roomId && !trackableId
      ? {
        AND: [
          base,
          {
            OR: [
              { homeId }, // ✅ new direct column
              { room: { is: { homeId } } },
              { trackable: { is: { homeId } } },
            ],
          },
        ],
      }
      : base;

  // Sorting
  const orderBy =
    sort === "-completedAt"
      ? [{ completedDate: "desc" as const }, { createdAt: "desc" as const }]
      : [{ dueDate: "asc" as const }, { createdAt: "asc" as const }];

  const tasks = await prisma.userTask.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      room: { select: { id: true, name: true, homeId: true } },
      trackable: {
        select: {
          id: true,
          userDefinedName: true,
          brand: true,
          model: true,
          kind: true,
          applianceCatalog: { select: { brand: true, model: true, type: true } },
          homeId: true,
          roomId: true,
        },
      },
      home: { select: { id: true } }, // optional, for completeness
    },
  });

  const out = tasks.map((t) => {
    const tr = t.trackable;
    const brand = tr?.brand ?? tr?.applianceCatalog?.brand ?? null;
    const model = tr?.model ?? tr?.applianceCatalog?.model ?? null;
    const type = tr?.kind ?? tr?.applianceCatalog?.type ?? null;

    return {
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      dueDate: t.dueDate?.toISOString() ?? null,
      completedAt: t.completedDate?.toISOString() ?? null,

      estimatedTimeMinutes: t.estimatedTimeMinutes ?? null,

      // scope
      homeId: t.homeId ?? null,
      roomId: t.roomId ?? null,
      roomName: t.room?.name ?? null,
      trackableId: tr?.id ?? null,
      itemName: t.itemName ?? "",

      // trackable adornments (for UI badges)
      trackableBrand: brand,
      trackableModel: model,
      trackableType: type,

      category: t.category,
      icon: t.icon ?? null,
      createdAt: (t as any).createdAt?.toISOString?.() ?? undefined,
    };
  });

  res.json(out);
});
