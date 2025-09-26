//dwellwell-api/src/routes/tasks/taskgen.ts
import { Router } from "express";
import { generateTasksFromTemplatesForRoom, generateTasksFromTemplatesForHome } from "../../services/taskgen/fromTemplates";

export const taskgen = Router();

taskgen.post("/room/:roomId", async (req, res) => {
  try {
    await generateTasksFromTemplatesForRoom(req.params.roomId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || "taskgen failed" });
  }
});

taskgen.post("/home/:homeId", async (req, res) => {
  try {
    await generateTasksFromTemplatesForHome(req.params.homeId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || "taskgen failed" });
  }
});

export default taskgen;
