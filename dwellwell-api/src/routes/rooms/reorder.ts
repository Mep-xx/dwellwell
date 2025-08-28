// dwellwell-api/src/routes/rooms/reorder.ts
import { Router } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.put("/reorder", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;
  const { homeId, roomIds } = req.body ?? {};
  if (!homeId || !Array.isArray(roomIds)) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  // Ensure the home belongs to the user
  const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
  if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  // Persist the order
  await prisma.$transaction(
    roomIds.map((id: string, idx: number) =>
      prisma.room.update({
        where: { id },
        data: { position: idx },
      })
    )
  );

  res.json({ ok: true });
});

export default router;
