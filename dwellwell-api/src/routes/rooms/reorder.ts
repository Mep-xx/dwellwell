// dwellwell-api/src/routes/rooms/reorder.ts
import { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { homeId, roomIds } = req.body ?? {};
  if (!homeId || !Array.isArray(roomIds)) return res.status(400).json({ error: "INVALID_INPUT" });

  const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
  if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  await prisma.$transaction(
    roomIds.map((id: string, idx: number) =>
      prisma.room.update({ where: { id }, data: { position: idx } })
    )
  );

  res.json({ ok: true });
});
