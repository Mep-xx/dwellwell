import { Router, Request, Response } from "express";
import { z } from "zod";
// If your project exposes the DB as "db" from src/db, keep this import.
// If it's named "prisma" or lives elsewhere, adjust the path/name below.
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

// Keep this intentionally permissive: many of your IDs look like cuid2 (e.g. "cmer...").
// If you KNOW your shape, switch to z.string().cuid() or .cuid2() as appropriate.
const Params = z.object({ id: z.string().min(1) });

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = Params.parse(req.params);

    // Adjust "rooms" include name to match your schema if needed
    // (e.g. rooms, Rooms, homeRooms). The list/summary code you shared
    // uses "rooms", so we'll keep that here.
    const home = await (prisma as any).home.findUnique({
      where: { id },
      include: {
        rooms: true, // <— rename if your relation is differently named
      },
    });

    if (!home) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    return res.json(home);
  } catch (err: any) {
    // This will surface the real error in your server logs.
    console.error("GET /api/homes/:id failed:", err);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      // keep the client payload simple; the console error above has details.
    });
  }
});

export default router;
