// dwellwell-api/src/routes/homes/update.ts
import { Router } from "express";
import { ZodError } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { updateHomeSchema, homeIdParam } from "./schema";
import { prisma } from "../../db/prisma";

const router = Router();

router.put("/:id", requireAuth, async (req, res) => {
  try {
    console.log('here');
    const { id } = homeIdParam.parse(req.params);
    const data = updateHomeSchema.parse(req.body);

    const updated = await prisma.home.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      console.error("[PUT /homes/:id] zod issues", JSON.stringify(err.issues, null, 2));
      return res.status(400).json({ message: "Invalid home update", issues: err.issues });
    }
    console.error("[homes:update] error", err);
    return res.status(500).json({ message: "Failed to update home" });
  }
});

export default router;
