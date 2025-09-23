//dwellwell-api/src/routes/forum/listCategories.ts
import { Request, Response } from "express";
import { prisma } from "../../../db/prisma"
import { asyncHandler } from "../../../middleware/asyncHandler";

export default asyncHandler(async (_req: Request, res: Response) => {
  // listCategories.ts
  const categories = await prisma.forumCategory.findMany({ orderBy: { order: "asc" } });
  if (categories.length === 0) {
    await prisma.forumCategory.createMany({
      data: [
        { slug: "general", name: "General", order: 1 },
        { slug: "bug-reports", name: "Bug Reports", order: 2 },
        { slug: "tips-and-tricks", name: "Tips & Tricks", order: 3 },
        { slug: "trackable-corrections", name: "Trackable Corrections", order: 4 },
      ],
      skipDuplicates: true,
    });
  }
  const fresh = categories.length ? categories :
    await prisma.forumCategory.findMany({ orderBy: { order: "asc" } });
  res.json({ categories: fresh });

});
