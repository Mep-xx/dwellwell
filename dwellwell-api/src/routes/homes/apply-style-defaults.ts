// dwellwell-api/src/routes/homes/apply-style-defaults.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { HOUSE_ROOM_TEMPLATES } from "@shared/constants";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

// URL params: /:id/rooms/apply-style-defaults
const paramsSchema = z.object({
  id: z.string().cuid(),
});

// Optional body override: { style?: string }
const bodySchema = z
  .object({
    style: z.string().trim().optional(),
  })
  .optional();

/**
 * POST /api/homes/:id/rooms/apply-style-defaults
 * - Uses the home's architecturalStyle (or body.style override) to look up a
 *   room template in HOUSE_ROOM_TEMPLATES.
 * - Adds any rooms from the template that the home does not already have,
 *   matching by case-insensitive room name.
 * - Returns { added, skipped } where:
 *     added  = number of rooms created from the template
 *     skipped = rooms that already existed (by name) and were not created
 */
router.post(
  "/:id/rooms/apply-style-defaults",
  requireAuth,
  async (req, res) => {
    try {
      const { id } = paramsSchema.parse(req.params);
      const body = bodySchema.parse(req.body) ?? {};

      const home = await prisma.home.findUnique({
        where: { id },
        select: { id: true, architecturalStyle: true },
      });

      if (!home) {
        return res.status(404).json({ message: "Home not found" });
      }

      // Allow a one-off override via body.style; otherwise default to home's style
      const styleKey = (body.style ?? home.architecturalStyle ?? "").trim();

      // Expecting HOUSE_ROOM_TEMPLATES[styleKey] to be:
      // Array<{ name: string; type: string; floor?: number }>
      const template = (HOUSE_ROOM_TEMPLATES as any)[styleKey] as
        | { name: string; type: string; floor?: number }[]
        | undefined;

      if (!Array.isArray(template) || template.length === 0) {
        // Nothing to do. Return a benign 200 so the client can proceed gracefully.
        return res.status(200).json({ added: 0, skipped: 0 });
      }

      const existing = await prisma.room.findMany({
        where: { homeId: id },
        select: { id: true, name: true, position: true },
        orderBy: { position: "asc" },
      });

      // Track existing names case-insensitively
      const existingNames = new Set(
        existing.map((r: { name: any; }) => (r.name ?? "").trim().toLowerCase())
      );

      // Continue positions after the current max (default to 0 if none)
      let nextPos =
        existing.length > 0
          ? Math.max(...existing.map((r: { position: any; }) => r.position ?? 0)) + 1
          : 1;

      const toCreate = template
        .filter(
          (t) => !existingNames.has((t.name ?? "").trim().toLowerCase())
        )
        .map((t) => ({
          name: t.name,
          type: t.type,
          floor: typeof t.floor === "number" ? t.floor : undefined,
          position: nextPos++,
          homeId: id,
        }));

      if (toCreate.length === 0) {
        return res
          .status(200)
          .json({ added: 0, skipped: template.length });
      }

      await prisma.room.createMany({ data: toCreate });

      return res.status(201).json({
        added: toCreate.length,
        skipped: template.length - toCreate.length,
      });
    } catch (err: any) {
      console.error("apply-style-defaults error:", err);
      return res
        .status(400)
        .json({ message: "Bad request", error: err?.message });
    }
  }
);

export default router;
