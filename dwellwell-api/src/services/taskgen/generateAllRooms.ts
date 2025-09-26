// dwellwell-api/src/services/taskgen/generateAllRooms.ts
import { prisma } from "../../db/prisma";
import { generateTasksFromTemplatesForRoom } from "./fromTemplates";

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
      await generateTasksFromTemplatesForRoom(r.id);
    } catch (e) {
      console.error("generateTasksForRoom error for", r.id, e);
    }
  }
}
