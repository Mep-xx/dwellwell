//dwellwell-api/src/routes/forum/updateThread.ts
import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { asyncHandler } from "../../../middleware/asyncHandler";

export default asyncHandler(async (req: Request, res: Response) => {
  const { threadId } = req.params;
  const { status, pinned, locked } = req.body as { status?: "open"|"acknowledged"|"in_progress"|"resolved"|"rejected"; pinned?: boolean; locked?: boolean; };

  const updated = await prisma.forumThread.update({
    where: { id: threadId },
    data: {
      ...(status ? { status } : {}),
      ...(typeof pinned === "boolean" ? { pinned } : {}),
      ...(typeof locked === "boolean" ? { locked } : {})
    }
  });
  res.json({ thread: updated });
});
