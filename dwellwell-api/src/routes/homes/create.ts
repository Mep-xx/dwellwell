// dwellwell-api/src/routes/homes/create.ts
import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";
import { createHomeSchema } from "./schema";
import { generateTasksFromTemplatesForHome } from "../../services/taskgen/fromTemplates";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = createHomeSchema.parse(req.body);

  const created = await prisma.home.create({
    data: { ...data, userId },
  });

  // Template-driven generation:
  // - Home-scoped templates
  // - Room-scoped templates for any rooms created with the home
  (async () => {
    try {
      await generateTasksFromTemplatesForHome(created.id);
    } catch (e) {
      console.error("generateTasksFromTemplatesForHome on create failed:", e);
    }
  })();

  res.status(201).json(created);
});

export default router;
