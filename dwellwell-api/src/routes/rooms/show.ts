//dwellwell-api/src/routes/rooms/show.ts
import { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { roomId } = req.params as any;

  const includeDetails = String(req.query.includeDetails || "false") === "true";

  const room = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    include: includeDetails ? { detail: true } : undefined,
  });

  if (!room) {
    return res.status(404).json({ error: "ROOM_NOT_FOUND" });
  }

  res.json(room);
});
