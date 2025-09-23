//dwellwell-api/src/routes/forum/acceptPost.ts
import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { awardXP } from "../../../services/gamification/awardXP";

export default asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  const post = await prisma.forumPost.update({ where: { id: postId }, data: { isAnswer: true }, select: { id: true, authorId: true, threadId: true }});
  await awardXP({ userId: post.authorId, kind: "forum.post.accepted", refType: "post", refId: post.id, deltaXP: 15 });

  res.json({ ok: true });
});
