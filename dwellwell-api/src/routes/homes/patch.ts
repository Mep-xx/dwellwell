// dwellwell-api/src/routes/homes/patch.ts
import { Request, Response, Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
// If/when you re-enable task generation, import here:
// import { generateTasksForHomeFeatures } from "../../services/taskGenerator";

const router = Router();

/**
 * PATCH /homes/:id
 * Accepts partial updates. If `features` is present (even empty array),
 * we update it (and can regenerate feature-based tasks later).
 */
router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id as string;
    const homeId = String((req.params as any).id || "");

    if (!homeId) {
      return res
        .status(400)
        .json({ error: "BAD_REQUEST", message: "Missing home id." });
    }

    const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

    const incoming = (req.body ?? {}) as Record<string, any>;

    // Build partial update payload—ignore only undefined
    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (v === undefined) continue;
      data[k] = v;
    }

    const updated = await prisma.home.update({
      where: { id: homeId },
      data,
    });

    // If you want auto task generation when features change, re-enable this:
    // if (Object.prototype.hasOwnProperty.call(incoming, "features")) {
    //   await generateTasksForHomeFeatures(homeId);
    // }

    res.json(updated);
  })
);

export default router;