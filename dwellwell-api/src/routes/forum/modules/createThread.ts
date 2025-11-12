import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { awardXP } from "../../../services/gamification/awardXP";
import type { Prisma } from "@prisma/client";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;

  const {
    categoryId: rawCategoryId,
    categorySlug,
    title,
    type,
    body,
    trackableId,
    taskTemplateId,
    tags = [],
  } = req.body as {
    categoryId?: string;
    categorySlug?: string;
    title: string;
    type?: "discussion" | "bug" | "tip" | "correction";
    body: string;
    trackableId?: string;
    taskTemplateId?: string;
    tags?: string[];
  };

  if (!title || !body) {
    return res.status(400).json({ error: "VALIDATION_FAILED", details: "title and body are required" });
  }

  // Resolve category id
  let categoryId = rawCategoryId ?? null;

  if (!categoryId && categorySlug) {
    const cat = await prisma.forumCategory.findUnique({ where: { slug: String(categorySlug) } });
    if (cat) categoryId = cat.id;
  }

  if (!categoryId) {
    const fallback =
      (await prisma.forumCategory.findUnique({ where: { slug: "general" } })) ??
      (await prisma.forumCategory.findFirst({ orderBy: { order: "asc" } }));
    if (fallback) categoryId = fallback.id;
  }

  if (!categoryId) {
    return res.status(400).json({ error: "VALIDATION_FAILED", details: "categoryId or a resolvable category is required" });
  }

  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const thread = await tx.forumThread.create({
      data: {
        categoryId,
        authorId: userId,
        title,
        type: (type as any) ?? "discussion",
        trackableId: trackableId ?? null,
        taskTemplateId: taskTemplateId ?? null,
        lastPostAt: new Date(),
      },
      select: { id: true },
    });

    await tx.forumPost.create({
      data: { threadId: thread.id, authorId: userId, body },
    });

    if (Array.isArray(tags) && tags.length) {
      const tagRecords = await tx.forumTag.findMany({ where: { slug: { in: tags } } });
      if (tagRecords.length) {
        await tx.forumTagOnThread.createMany({
          data: tagRecords.map((r: { id: any; }) => ({ threadId: thread.id, tagId: r.id })),
          skipDuplicates: true,
        });
      }
    }

    await tx.forumThread.update({
      where: { id: thread.id },
      data: { commentCount: { increment: 1 } },
    });

    return thread;
  });

  await awardXP({
    userId,
    kind: "forum.thread.create",
    refType: "thread",
    refId: created.id,
    deltaXP: 5,
  });

  res.status(201).json({ threadId: created.id });
});
