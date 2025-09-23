//dwellwell-api/src/routes/forum/modules/listRecent.ts
import { asyncHandler } from "../../../middleware/asyncHandler";
import { prisma } from "../../../db/prisma";
import { Request, Response } from "express";

export default asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? "6"), 10)));
  const items = await prisma.forumThread.findMany({
    orderBy: [{ lastPostAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true, title: true, status: true, score: true,
      commentCount: true, lastPostAt: true,
      category: { select: { slug: true, name: true } },
      author: { select: { id: true, email: true, profile: { select: { avatarUrl: true } } } },
    }
  });
  res.json({ items });
});
