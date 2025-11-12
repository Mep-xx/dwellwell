import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";
import type { Prisma } from "@prisma/client";

export default asyncHandler(async (req: Request, res: Response) => {
  const editorId = (req as any).user.id as string;
  const { postId } = req.params;
  const { body } = req.body as { body: string };

  const prev = await prisma.forumPost.findUnique({ where: { id: postId }, select: { body: true }});
  if (!prev) return res.status(404).json({ error: "Not found" });

  const post = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.forumPostEdit.create({ data: { postId, editorId, prevBody: prev.body, newBody: body } });
    return tx.forumPost.update({ where: { id: postId }, data: { body } });
  });

  res.json({ post });
});
