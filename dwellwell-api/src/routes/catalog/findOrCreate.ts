// dwellwell-api/src/routes/catalog/findOrCreate.ts
import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { Prisma } from "@prisma/client";
import { enrichApplianceTasks } from "../../services/taskgen/enrichApplianceTasks";

const router = Router();

/**
 * Body:
 * {
 *   brand: string,
 *   model: string,
 *   type?: string,
 *   category?: string,
 *   notes?: string,
 *   imageUrl?: string
 * }
 *
 * Creates the catalog row if missing, awards gamification (once),
 * and kicks off enrichment to generate/link TaskTemplates.
 */
router.post(
  "/find-or-create",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any)?.user?.id as string | undefined;
    if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

    const {
      brand,
      model,
      type,
      category,
      notes,
      imageUrl,
    } = (req.body ?? {}) as {
      brand?: string;
      model?: string;
      type?: string | null;
      category?: string | null;
      notes?: string | null;
      imageUrl?: string | null;
    };

    if (!brand || !model) {
      return res.status(400).json({ error: "BRAND_AND_MODEL_REQUIRED" });
    }

    const clean = {
      brand: String(brand).trim(),
      model: String(model).trim(),
      type: type ? String(type).trim().toLowerCase() : "appliance",
      category: category ? String(category).trim().toLowerCase() : "appliance",
      notes: notes ? String(notes).trim() : null,
      imageUrl: imageUrl && /^https?:\/\//i.test(String(imageUrl)) ? String(imageUrl) : null,
    };

    // Upsert by composite unique (brand, model)
    const catalog = await prisma.applianceCatalog.upsert({
      where: { brand_model: { brand: clean.brand, model: clean.model } },
      update: {
        type: clean.type ?? undefined,
        category: clean.category ?? undefined,
        notes: clean.notes ?? undefined,
        imageUrl: clean.imageUrl ?? undefined,
      },
      create: {
        brand: clean.brand,
        model: clean.model,
        type: clean.type,
        category: clean.category,
        notes: clean.notes ?? undefined,
        imageUrl: clean.imageUrl ?? undefined,
      },
    });

    // Award gamification once per user+catalog
    try {
      // respect user setting; if settings row missing, treat as enabled
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      const enabled = settings?.gamificationEnabled !== false;

      if (enabled) {
        await prisma.gamificationEvent.create({
          data: {
            userId,
            kind: "catalog_contribution",
            refType: "appliance_catalog",
            refId: catalog.id,
            deltaXP: 25,
          },
        });
      }
    } catch {
      // unique constraint will guard duplicates; errors are non-fatal
    }

    // Kick enrichment (idempotent; will log issues if OpenAI not configured)
    let linked = 0;
    try {
      linked = await enrichApplianceTasks({ prisma, catalogId: catalog.id });
    } catch (e) {
      await prisma.taskGenerationIssue.create({
        data: {
          userId,
          homeId: null,
          roomId: null,
          trackableId: null,
          code: "enrichment_lookup_failed",
          status: "open",
          message: `enrichApplianceTasks failed for catalogId=${catalog.id}`,
          debugPayload: { error: String(e) },
        },
      }).catch(() => {});
    }

    // Also return any existing linked templates (for UI hints)
    const links = await prisma.applianceTaskTemplate.findMany({
      where: { applianceCatalogId: catalog.id },
      include: { taskTemplate: true },
    });

    res.json({
      catalog,
      linkedTemplates: links.map((l) => ({
        id: l.taskTemplate.id,
        title: l.taskTemplate.title,
        recurrenceInterval: l.taskTemplate.recurrenceInterval,
      })),
      linkedCount: linked || links.length,
    });
  })
);

export default router;
