//dwellwell-api/src/routes/forum/resolveThread.ts
import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { awardXP } from "../../../services/gamification/awardXP";

export default asyncHandler(async (req: Request, res: Response) => {
  const { threadId } = req.params;
  const t = await prisma.forumThread.update({ where: { id: threadId }, data: { status: "resolved" }, select: { id: true, authorId: true }});
  await awardXP({ userId: t.authorId, kind: "forum.bug.resolved", refType: "thread", refId: t.id, deltaXP: 15 });
  res.json({ ok: true });
});
