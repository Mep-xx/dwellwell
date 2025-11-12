import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { awardXP } from "../../../services/gamification/awardXP";
import type { Prisma } from "@prisma/client";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;
  const { threadId } = req.params;
  const { body } = req.body as { body: string };

  const post = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const p = await tx.forumPost.create({ data: { threadId, authorId: userId, body } });
    await tx.forumThread.update({
      where: { id: threadId },
      data: { commentCount: { increment: 1 }, lastPostAt: new Date() }
    });
    return p;
  });

  await awardXP({ userId, kind: "forum.post.create", refType: "post", refId: post.id, deltaXP: 2 });

  res.status(201).json({ post });
});
