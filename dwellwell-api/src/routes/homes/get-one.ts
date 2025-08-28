// src/routes/homes/get-one.ts
import { Router } from "express";
import { prisma } from "../../db/prisma"; // adjust import to your prisma instance
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

/**
 * GET /api/homes/:homeId
 * Returns a single home with rooms.
 */
router.get("/:homeId", requireAuth, async (req, res) => {
  const { homeId } = req.params;
  try {
    const home = await prisma.home.findUnique({
      where: { id: homeId },
      include: { rooms: true },
    });
    if (!home) return res.status(404).json({ message: "Home not found" });
    return res.json(home);
  } catch (e) {
    console.error("get-one error", e);
    return res.status(500).json({ message: "Failed to load home" });
  }
});

export default router;
