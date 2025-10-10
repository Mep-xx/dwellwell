// dwellwell-api/src/routes/admin/tools.ts
import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";
import { PrismaClient, TaskCriticality, TaskType } from "@prisma/client";
import { ApplianceCatalog as SeedCatalog } from "../../lib/mockApplianceCatalog";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth, requireAdmin);

/**
 * POST /admin/tools/run-seeds
 * Runs the same logic as your CLI seed, but from the admin UI.
 * Safe/idempotent.
 */
router.post("/run-seeds", async (req: Request, res: Response) => {
  try {
    // 1) Seed catalog
    for (const a of SeedCatalog) {
      await prisma.applianceCatalog.upsert({
        where: { brand_model: { brand: a.brand, model: a.model } },
        update: {},
        create: {
          brand: a.brand,
          model: a.model,
          type: a.type,
          category: a.category,
          notes: a.notes || "",
          imageUrl: a.imageUrl || null,
        },
      });
    }

    // 2) Seed a focused set of templates (mirror of lib/seed.ts)
    const templates = [
      {
        title: "Change HVAC Filter",
        description: "Replace the air filter to ensure efficient airflow.",
        recurrenceInterval: "3 months",
        criticality: "high",
        canDefer: false,
        deferLimitDays: 0,
        estimatedTimeMinutes: 10,
        estimatedCost: 20,
        canBeOutsourced: false,
        category: "appliance",
        icon: "🌬️",
        taskType: "GENERAL",
        steps: ["Turn off the HVAC system", "Remove old filter", "Insert new filter facing airflow direction arrows"],
        equipmentNeeded: ["New air filter", "Gloves"],
        resources: [],
      },
    ] satisfies Array<{
      title: string; description: string; recurrenceInterval: string;
      criticality: TaskCriticality; canDefer: boolean; deferLimitDays: number;
      estimatedTimeMinutes: number; estimatedCost: number; canBeOutsourced: boolean;
      category: string; icon: string; taskType: TaskType; steps: string[]; equipmentNeeded: string[]; resources: any[];
    }>;

    for (const tpl of templates) {
      const existing = await prisma.taskTemplate.findFirst({ where: { title: tpl.title } });
      if (existing) await prisma.taskTemplate.update({ where: { id: existing.id }, data: tpl });
      else await prisma.taskTemplate.create({ data: tpl });
    }

    // 3) Kind mappings (minimal)
    const hvacTpl = await prisma.taskTemplate.findFirst({ where: { title: "Change HVAC Filter" } });
    if (hvacTpl) {
      await prisma.trackableKindTaskTemplate.upsert({
        where: { kind_taskTemplateId: { kind: "hvac", taskTemplateId: hvacTpl.id } },
        update: {},
        create: { kind: "hvac", category: "appliance", taskTemplateId: hvacTpl.id },
      });
    }

    res.json({ ok: true, message: "Seeds executed" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
});

export default router;
