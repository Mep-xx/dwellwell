// dwellwell-api/src/routes/homes/apply-style-defaults.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { HOUSE_ROOM_TEMPLATES } from "@shared/constants";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

const paramsSchema = z.object({ id: z.string().cuid() });

router.post("/:id/rooms/apply-style-defaults", requireAuth, async (req, res) => {
  try {
    const { id } = paramsSchema.parse(req.params);

    const home = await prisma.home.findUnique({
      where: { id },
      select: { id: true, architecturalStyle: true },
    });
    if (!home) return res.status(404).json({ message: "Home not found" });

    const style = (req.body?.style as string) ?? home.architecturalStyle ?? "";
    const template = (HOUSE_ROOM_TEMPLATES as any)[style] as
      | { name: string; type: string; floor?: number }[]
      | undefined;

    if (!template?.length) {
      return res.status(200).json({ added: 0, skipped: 0 });
    }

    const existing = await prisma.room.findMany({
      where: { homeId: id },
      select: { id: true, name: true, position: true },
      orderBy: { position: "asc" },
    });

    const existingNames = new Set(
      existing.map((r) => (r.name || "").trim().toLowerCase())
    );
    let pos = existing.length ? Math.max(...existing.map((r) => r.position ?? 0)) : 0;

    const toCreate = template
      .filter((t) => !existingNames.has((t.name || "").trim().toLowerCase()))
      .map((t) => {
        pos += 1;
        return {
          name: t.name,
          type: t.type,
          floor: typeof t.floor === "number" ? t.floor : undefined,
          position: pos,
          homeId: id,
        };
      });

    if (!toCreate.length) {
      return res.status(200).json({ added: 0, skipped: template.length });
    }

    await prisma.room.createMany({ data: toCreate });
    return res
      .status(201)
      .json({ added: toCreate.length, skipped: template.length - toCreate.length });
  } catch (err: any) {
    console.error("apply-style-defaults error:", err);
    return res.status(400).json({ message: "Bad request", error: err?.message });
  }
});

export default router;