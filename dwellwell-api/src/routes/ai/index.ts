// dwellwell-api/src/routes/ai/index.ts
import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import lookupAppliance from "./lookupAppliance";
import identifyProductWeb from "./identifyProductWeb";
import taskPlanRouter from "./taskPlan";

const router = Router();

// all /ai routes require auth
router.use(requireAuth);

// GET /api/ai/lookup-appliance
router.get("/lookup-appliance", lookupAppliance);

// GET /api/ai/identify-product-web
router.get("/identify-product-web", identifyProductWeb);

// POST /api/ai/task-plan
router.use(taskPlanRouter);

export default router;
