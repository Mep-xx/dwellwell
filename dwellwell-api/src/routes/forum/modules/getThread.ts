import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";

export default asyncHandler(async (req: Request, res: Response) => {
  const { threadId } = req.params;

  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    include: {
      category: true,
      author: { select: { id: true, email: true } },
      tags: { include: { tag: true } }
    }
  });
  if (!thread) return res.status(404).json({ error: "Not found" });

  const posts = await prisma.forumPost.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, email: true } } }
  });

  const authorIds = Array.from(new Set([thread.authorId, ...posts.map((p: { authorId: any; }) => p.authorId)])).filter(Boolean) as string[];
  const reps = await prisma.reputationSnapshot.findMany({ where: { userId: { in: authorIds } } });
  const repMap = Object.fromEntries(
    reps.map((p: { userId: string; totalXP: number; level: number }) => [p.userId, { level: p.level, totalXP: p.totalXP }])
  );

  res.json({ thread: { ...thread, posts }, rep: repMap });
});
