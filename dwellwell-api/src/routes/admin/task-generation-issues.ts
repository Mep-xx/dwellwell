//dwellwell-api/src/routes/admin/task-generation-issues.ts
import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAuth, requireAdmin);

/**
 * GET /admin/task-generation-issues
 * Adds enriched info for user/home/room/trackable without using Prisma includes
 * (to avoid relation typing problems against your current schema).
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { code, status, userId, homeId, roomId, trackableId, q } = req.query as Record<string, string | undefined>;

    const where: any = {
      code: code || undefined,
      status: status || undefined,
      userId: userId || undefined,
      homeId: homeId || undefined,
      roomId: roomId || undefined,
      trackableId: trackableId || undefined,
      OR: q ? [{ message: { contains: q, mode: "insensitive" as const } }] : undefined,
    };

    const raw = await prisma.taskGenerationIssue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      // no include — we’ll enrich manually
    });

    // Collect IDs for batch lookups
    const userIds = Array.from(new Set(raw.map(r => r.userId).filter(Boolean))) as string[];
    const homeIds = Array.from(new Set(raw.map(r => r.homeId).filter(Boolean))) as string[];
    const roomIds = Array.from(new Set(raw.map(r => r.roomId).filter(Boolean))) as string[];
    const trackableIds = Array.from(new Set(raw.map(r => r.trackableId).filter(Boolean))) as string[];

    const [users, homes, rooms, trackables] = await Promise.all([
      userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } }) : Promise.resolve([]),
      homeIds.length ? prisma.home.findMany({ where: { id: { in: homeIds } }, select: { id: true, address: true, city: true, state: true } }) : Promise.resolve([]),
      roomIds.length ? prisma.room.findMany({ where: { id: { in: roomIds } }, select: { id: true, name: true, type: true } }) : Promise.resolve([]),
      trackableIds.length ? prisma.trackable.findMany({
        where: { id: { in: trackableIds } },
        select: {
          id: true,
          userDefinedName: true,
          applianceCatalog: { select: { brand: true, model: true, type: true } },
        },
      }) : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const homeMap = new Map(homes.map(h => [h.id, h]));
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const trackableMap = new Map(trackables.map(t => [t.id, t]));

    const items = raw.map(r => ({
      ...r,
      user: r.userId ? userMap.get(r.userId) ?? null : null,
      home: r.homeId ? homeMap.get(r.homeId) ?? null : null,
      room: r.roomId ? roomMap.get(r.roomId) ?? null : null,
      trackable: r.trackableId ? trackableMap.get(r.trackableId) ?? null : null,
    }));

    res.json(items);
  } catch (err: any) {
    console.error("GET /admin/task-generation-issues failed:", err);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

/**
 * POST /admin/task-generation-issues/:id/resolve
 */
router.post("/:id/resolve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.taskGenerationIssue.update({
      where: { id },
      data: { status: "resolved" },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to resolve" });
  }
});

/**
 * POST /admin/task-generation-issues/:id/retry
 * (lightweight retry hook; records an event and flags status)
 */
router.post("/:id/retry", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await prisma.taskGenerationIssue.findUnique({ where: { id } });
    if (!issue) return res.status(404).json({ error: "NOT_FOUND" });

    await prisma.lifecycleEvent.create({
      data: {
        userId: issue.userId,
        entity: "taskgen_issue",
        entityId: id,
        action: "retry_requested",
        metadata: { homeId: issue.homeId, roomId: issue.roomId, trackableId: issue.trackableId, code: issue.code },
      },
    });

    const updated = await prisma.taskGenerationIssue.update({
      where: { id },
      data: { status: "in_progress" },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "RETRY_FAILED", message: err?.message ?? String(err) });
  }
});

export default router;
