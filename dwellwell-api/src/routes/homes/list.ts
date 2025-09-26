// dwellwell-api/src/routes/homes/list.ts
import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

/**
 * GET /homes
 * Returns an ARRAY of homes (to match existing clients expecting ApiHome[]).
 * Includes each home's rooms (lightweight selection) sorted by position.
 * No top-level awaits; everything runs inside the handler.
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  try {
    const homes = await prisma.home.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        rooms: {
          select: {
            id: true,
            name: true,
            type: true,
            position: true,
            floor: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });

    // IMPORTANT: return just the array (no wrapper object),
    // so client code like `data.map(...)` works.
    return res.json(homes);
  } catch (err) {
    console.error("[homes/list] error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;
