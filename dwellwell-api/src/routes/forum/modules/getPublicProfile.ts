//dwellwell-api/src/routes/forum/modules/getPublicProfile.ts
import { asyncHandler } from "../../../middleware/asyncHandler";
import { prisma } from "../../../db/prisma";
import { Request, Response } from "express";

export default asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, profile: { select: { avatarUrl: true } } },
  });
  if (!user) return res.status(404).json({ error: "Not found" });

  const rep = await prisma.reputationSnapshot.findFirst({ where: { userId } });
  // Recent posts/threads
  const [threads, posts] = await Promise.all([
    prisma.forumThread.findMany({
      where: { authorId: userId }, orderBy: { lastPostAt: "desc" }, take: 5,
      select: { id: true, title: true, lastPostAt: true, score: true, category: { select: { slug: true, name: true } } }
    }),
    prisma.forumPost.findMany({
      where: { authorId: userId }, orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, createdAt: true, threadId: true, thread: { select: { title: true } } }
    }),
  ]);

  res.json({
    user,
    rep: { level: rep?.level ?? 1, totalXP: rep?.totalXP ?? 0 },
    threads, posts
  });
});
