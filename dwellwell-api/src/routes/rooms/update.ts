// dwellwell-api/src/routes/rooms/update.ts
import { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { generateTasksForRoom } from "../../services/taskGenerator";

function stripUndefined(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

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

  // Ensure ownership + load prior type
  const before = await prisma.room.findFirst({
    where: { id: roomId, home: { userId } },
    select: { id: true, type: true },
  });
  if (!before) return res.status(404).json({ error: "ROOM_NOT_FOUND" });

  // Basic fields (only if we actually have something)
  const data: any = {};
  if (name !== undefined) data.name = (name ?? "").trim();
  if (type !== undefined) data.type = (type ?? "Other").trim();
  if (floor !== undefined) data.floor = floor;
  if (position !== undefined && position !== null) data.position = position;

  if (Object.keys(data).length > 0) {
    await prisma.room.update({ where: { id: roomId }, data });
  }

  // Details (only if we actually have something)
  if (details && typeof details === "object") {
    const cleaned = stripUndefined(details);
    if (Object.keys(cleaned).length > 0) {
      await prisma.roomDetail.upsert({
        where: { roomId },
        create: { roomId, ...cleaned },
        update: cleaned,
      });
    }
  }

  const updated = await prisma.room.findUnique({
    where: { id: roomId },
    include: { detail: true },
  });
  res.json(updated);

  // If type changed, refresh tasks for this room
  if (type !== undefined && before.type !== (type ?? before.type)) {
    await generateTasksForRoom(roomId);
  }
});
