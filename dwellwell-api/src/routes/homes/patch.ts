// dwellwell-api/src/routes/homes/patch.ts
import { Router } from "express";
import { ZodError } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { updateHomeSchema, homeIdParam } from "./schema";
import { prisma } from "../../db/prisma";

const router = Router();

router.patch("/:id", requireAuth, async (req, res) => {
    try {
        const { id } = homeIdParam.parse(req.params);
        // Accept *any* subset of update fields
        const data = updateHomeSchema.parse(req.body);

        console.log(id);
        console.log(data);

        const updated = await prisma.home.update({ where: { id }, data });
        res.json(updated);
    } catch (err) {
        if (err instanceof ZodError) {
            return res.status(400).json({ message: "Invalid home update", issues: err.issues });
        }
        console.error("[homes:patch] error", err);
        res.status(500).json({ message: "Failed to update home" });
    }
});

export default router;
