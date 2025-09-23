//dwellwell-api/src/routes/forum/listThreads.ts
import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";

export default asyncHandler(async (req: Request, res: Response) => {
  const { categorySlug, tag, q, page = "1" } = req.query as Record<string, string>;
  const pageSize = 20;
  const pageNum = Math.max(1, parseInt(page || "1", 10));

  const category = categorySlug
    ? await prisma.forumCategory.findUnique({ where: { slug: categorySlug } })
    : null;

  const where: any = {};
  if (category) where.categoryId = category.id;
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (tag) where.tags = { some: { tag: { slug: tag } } };

  const [items, total] = await Promise.all([
    prisma.forumThread.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { lastPostAt: "desc" }, { createdAt: "desc" }],
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, title: true, type: true, status: true, score: true,
        commentCount: true, lastPostAt: true, createdAt: true,
        category: { select: { slug: true, name: true } },
        author: { select: { id: true, email: true } }
      }
    }),
    prisma.forumThread.count({ where })
  ]);

  res.json({ items, total, page: pageNum, pageSize });
});
