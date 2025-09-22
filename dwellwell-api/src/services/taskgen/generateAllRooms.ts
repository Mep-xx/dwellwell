import { prisma } from "../../db/prisma";
import { generateTasksForRoom } from ".";

/**
 * Generate tasks for every existing room under a home.
 * Safe to call repeatedly; per-room generation is idempotent (upserted).
 */
export async function generateTasksForAllRooms(homeId: string) {
  const rooms = await prisma.room.findMany({
    where: { homeId },
    select: { id: true },
  });
  for (const r of rooms) {
    try {
      await generateTasksForRoom(r.id);
    } catch (e) {
      console.error("generateTasksForRoom error for", r.id, e);
    }
  }
}
