//dwellwell-api/src/routes/forum/vote.ts
import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { awardXP } from "../../../services/gamification/awardXP";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;
  const { threadId, postId, value } = req.body as { threadId?: string; postId?: string; value: 1 | -1 };

  if (!threadId && !postId) return res.status(400).json({ error: "threadId or postId required" });

  const existing = await prisma.forumVote.findFirst({ where: { userId, threadId: threadId ?? undefined, postId: postId ?? undefined }});
  const delta = existing ? value - existing.value : value;

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.forumVote.update({ where: { id: existing.id }, data: { value } });
    } else {
      await tx.forumVote.create({ data: { userId, threadId: threadId ?? null, postId: postId ?? null, value } });
    }
    if (threadId) await tx.forumThread.update({ where: { id: threadId }, data: { score: { increment: delta } }});
    if (postId) await tx.forumPost.update({ where: { id: postId }, data: { score: { increment: delta } }});
  });

  // XP to author only for positive delta
  if (delta > 0) {
    if (postId) {
      const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { authorId: true }});
      if (post) await awardXP({ userId: post.authorId, kind: "forum.post.upvoted", refType: "post", refId: postId, deltaXP: 1 });
    } else if (threadId) {
      const thread = await prisma.forumThread.findUnique({ where: { id: threadId }, select: { authorId: true }});
      if (thread) await awardXP({ userId: thread.authorId, kind: "forum.thread.upvoted", refType: "thread", refId: threadId, deltaXP: 1 });
    }
  }

  res.json({ ok: true });
});
