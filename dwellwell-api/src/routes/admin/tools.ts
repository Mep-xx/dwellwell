// dwellwell-api/src/routes/admin/tools.ts
import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";
import { PrismaClient } from "@prisma/client";
import { ApplianceCatalog as SeedCatalog } from "../../lib/mockApplianceCatalog";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth, requireAdmin);

router.post("/run-seeds", async (req: Request, res: Response) => {
  try {
    // 1) Seed ApplianceCatalog
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

    // 2) Seed a focused set of TaskTemplates
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
        steps: [
          "Turn off the HVAC system",
          "Remove old filter",
          "Insert new filter facing airflow direction arrows",
        ],
        equipmentNeeded: ["New air filter", "Gloves"],
        resources: [] as Array<{ label: string; url: string }>,
      },
    ];

    for (const tpl of templates) {
      const existing = await prisma.taskTemplate.findFirst({
        where: { title: tpl.title },
      });

      const mutableSteps = Array.from(tpl.steps ?? []);
      const mutableEquipment = Array.from(tpl.equipmentNeeded ?? []);
      const mutableResources = Array.from(tpl.resources ?? []);

      if (existing) {
        // UPDATE: omit taskType to avoid enum update typing
        await prisma.taskTemplate.update({
          where: { id: existing.id },
          data: {
            title: tpl.title,
            description: tpl.description,
            recurrenceInterval: tpl.recurrenceInterval,
            criticality: tpl.criticality as any,
            canDefer: tpl.canDefer,
            deferLimitDays: tpl.deferLimitDays,
            estimatedTimeMinutes: tpl.estimatedTimeMinutes,
            estimatedCost: tpl.estimatedCost,
            canBeOutsourced: tpl.canBeOutsourced,
            category: tpl.category,
            icon: tpl.icon,
            steps: { set: mutableSteps },
            equipmentNeeded: { set: mutableEquipment },
            resources: { set: mutableResources },
            // NOTE: no taskType here
          },
        });
      } else {
        // CREATE: taskType is REQUIRED by your schema — set it and cast
        await prisma.taskTemplate.create({
          data: {
            title: tpl.title,
            description: tpl.description,
            recurrenceInterval: tpl.recurrenceInterval,
            criticality: tpl.criticality as any,
            canDefer: tpl.canDefer,
            deferLimitDays: tpl.deferLimitDays,
            estimatedTimeMinutes: tpl.estimatedTimeMinutes,
            estimatedCost: tpl.estimatedCost,
            canBeOutsourced: tpl.canBeOutsourced,
            category: tpl.category,
            icon: tpl.icon,
            steps: mutableSteps,
            equipmentNeeded: mutableEquipment,
            resources: mutableResources,
            taskType: "GENERAL" as any, // <- required field, cast to satisfy enum
          },
        });
      }
    }

    // 3) Create Kind → Template mapping
    const hvacTpl = await prisma.taskTemplate.findFirst({
      where: { title: "Change HVAC Filter" },
    });

    if (hvacTpl) {
      await prisma.trackableKindTaskTemplate.upsert({
        where: {
          kind_taskTemplateId: { kind: "hvac", taskTemplateId: hvacTpl.id },
        },
        update: {},
        create: {
          kind: "hvac",
          category: "appliance",
          taskTemplateId: hvacTpl.id,
        },
      });
    }

    res.json({ ok: true, message: "Seeds executed successfully" });
  } catch (e: any) {
    console.error("Error running admin tools:", e);
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
});

export default router;
