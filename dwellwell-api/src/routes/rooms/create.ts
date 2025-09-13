//dwellwell-api\src\routes\rooms\create.ts
import { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";

function stripUndefined(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  const { homeId, name, type, floor, position, details } = (req.body ?? {}) as {
    homeId?: string;
    name?: string | null;
    type?: string | null;
    floor?: number | null;
    position?: number | null;
    details?: Record<string, any> | null;
  };

  if (!homeId) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "homeId is required" });
  }

  // Ensure the home belongs to the user
  const home = await prisma.home.findFirst({
    where: { id: homeId, userId },
    select: { id: true },
  });
  if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  // Append by default
  const nextPosition =
    typeof position === "number"
      ? position
      : await prisma.room.count({ where: { homeId } });

  const created = await prisma.room.create({
    data: {
      homeId,
      name: (name ?? "").trim(),
      type: (type ?? "Other").trim(),
      floor: floor ?? null,
      position: nextPosition,
    },
  });

  if (details && typeof details === "object") {
    const cleaned = stripUndefined(details);
    if (Object.keys(cleaned).length > 0) {
      await prisma.roomDetail.upsert({
        where: { roomId: created.id },
        create: { roomId: created.id, ...cleaned },
        update: cleaned,
      });
    }
  }

  const full = await prisma.room.findUnique({
    where: { id: created.id },
    include: { detail: true },
  });

  return res.status(201).json(full);
});
