//dwellwell-api/src/routes/taskgen.ts
import { Router } from "express";

/**
 * If you already have these in a service file, import them here.
 * Replace the stubs below with your real implementations.
 */
// import { generateTasksForRoom, generateTasksForHomeBasics } from "../../services/taskgen";

async function generateTasksForRoom(roomId: string) {
  // TODO: replace with real implementation
  console.log("[taskgen] generateTasksForRoom", roomId);
}
async function generateTasksForHomeBasics(homeId: string) {
  // TODO: replace with real implementation
  console.log("[taskgen] generateTasksForHomeBasics", homeId);
}

export const taskgen = Router();

/**
 * POST /tasks/taskgen/room/:roomId
 */
taskgen.post("/room/:roomId", async (req, res) => {
  try {
    await generateTasksForRoom(req.params.roomId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || "taskgen failed" });
  }
});

/**
 * POST /tasks/taskgen/home/:homeId
 */
taskgen.post("/home/:homeId", async (req, res) => {
  try {
    await generateTasksForHomeBasics(req.params.homeId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || "taskgen failed" });
  }
});

export default taskgen;
