// dwellwell-api/src/routes/rooms/update.ts
import { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { generateTasksForRoom } from "../../services/taskgen";

function stripUndefined(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

/**
 * Update a room (and optional RoomDetail). If the type or key detail flags
 * changed, re-run rule-based generation for this room.
 */
export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  const { roomId } = req.params as any;

  const { name, type, floor, position, details } = (req.body ?? {}) as {
    name?: string | null;
    type?: string | null;
    floor?: number | null;
    position?: number | null;
    details?: Record<string, any> | null;
  };

  // Ensure ownership + load prior state
  const before = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    include: { detail: true },
  });
  if (!before) return res.status(404).json({ error: "ROOM_NOT_FOUND" });

  // Update basic fields if provided
  const data: any = {};
  if (name !== undefined) data.name = (name ?? "").trim();
  if (type !== undefined) data.type = (type ?? "Other").trim();
  if (floor !== undefined) data.floor = floor;
  if (position !== undefined && position !== null) data.position = position;

  if (Object.keys(data).length > 0) {
    await prisma.room.update({ where: { id: roomId }, data });
  }

  // Update details if provided
  let detailsChanged = false;
  if (details && typeof details === "object") {
    const cleaned = stripUndefined(details);
    if (Object.keys(cleaned).length > 0) {
      await prisma.roomDetail.upsert({
        where: { roomId },
        create: { roomId, ...cleaned },
        update: cleaned,
      });
      detailsChanged = true;
    }
  }

  const updated = await prisma.room.findUnique({
    where: { id: roomId },
    include: { detail: true },
  });
  res.json(updated);

  // If type or detail flags changed, refresh tasks for this room
  const typeChanged = type !== undefined && before.type !== (type ?? before.type);
  if (typeChanged || detailsChanged) {
    try {
      await generateTasksForRoom(roomId);
    } catch (e) {
      console.error("[rooms/update] taskgen error:", e);
    }
  }
});
