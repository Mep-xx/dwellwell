//dwellwell-api/src/routes/admin/task-generation-issues/ts
import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", async (req: Request, res: Response) => {
  const { code, status, userId, homeId, roomId, trackableId, q } = req.query as any;
  const items = await prisma.taskGenerationIssue.findMany({
    where: {
      code: code || undefined,
      status: status || undefined,
      userId: userId || undefined,
      homeId: homeId || undefined,
      roomId: roomId || undefined,
      trackableId: trackableId || undefined,
      OR: q
        ? [
            { message: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(items);
});

router.post("/:id/resolve", async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await prisma.taskGenerationIssue.update({
    where: { id },
    data: { status: "resolved" },
  });
  res.json(updated);
});

export default router;
