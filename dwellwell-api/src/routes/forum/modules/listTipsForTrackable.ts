//dwellwell-api/src/routes/forum/listTipsForTrackables.ts
import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";

export default asyncHandler(async (req: Request, res: Response) => {
  const { trackableId, limit = "3" } = req.query as Record<string, string>;
  if (!trackableId) return res.status(400).json({ error: "trackableId required" });

  const take = Math.min(10, Math.max(1, parseInt(limit, 10)));
  const tips = await prisma.forumThread.findMany({
    where: { type: "tip", trackableId, status: { in: ["open", "resolved"] } },
    orderBy: [{ score: "desc" }, { lastPostAt: "desc" }],
    take,
    select: {
      id: true, title: true, score: true,
      posts: { take: 1, orderBy: { createdAt: "asc" }, select: { body: true } }
    }
  });
  res.json({ tips });
});
