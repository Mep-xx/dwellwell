// dwellwell-api/src/routes/rooms/index.ts
import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import list from "./list";
import create from "./create";
import update from "./update";
import remove from "./remove";
import reorder from "./reorder";
import show from "./show";
import tasks from "./tasks";

const router = Router();

// All room routes require auth
router.use(requireAuth);

router.get("/", list);                 // GET /api/rooms?homeId=...&includeDetails=true
router.post("/", create);              // POST /api/rooms
router.put("/reorder", reorder);       // PUT /api/rooms/reorder
router.get("/:roomId", show);          // GET /api/rooms/:roomId
router.get("/:roomId/tasks", tasks);   // GET /api/rooms/:roomId/tasks
router.put("/:roomId", update);        // PUT /api/rooms/:roomId
router.delete("/:roomId", remove);     // DELETE /api/rooms/:roomId

export default router;
