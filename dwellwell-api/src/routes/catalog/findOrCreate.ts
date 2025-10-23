import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
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
 * Creates/updates the catalog row, awards gamification (once),
 * and kicks off enrichment to generate/link TaskTemplates.
 */
router.post(
  "/find-or-create",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any)?.user?.id as string | undefined;
    if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

    const { brand, model, type, category, notes, imageUrl } = (req.body ?? {}) as {
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
      // default both to "appliance" if not provided
      type: type ? String(type).trim().toLowerCase() : "appliance",
      category: category ? String(category).trim().toLowerCase() : "appliance",
      notes: notes ? String(notes).trim() : null,
      imageUrl:
        imageUrl && /^https?:\/\//i.test(String(imageUrl))
          ? String(imageUrl)
          : null,
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

    // Award gamification once per (userId, kind, refType, refId)
    try {
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      const enabled = settings?.gamificationEnabled !== false;

      if (enabled) {
        const kind = "catalog_find_or_create"; // change if you use enums
        const refType = "applianceCatalog";
        const refId = catalog.id;

        await prisma.gamificationEvent.createMany({
          data: [
            {
              userId,
              kind,
              refType,
              refId,
              deltaXP: 10, // ✅ required by your Prisma model
            },
          ],
          skipDuplicates: true, // ignore if it already exists
        });
      }
    } catch {
      // non-fatal; uniqueness guard will ignore duplicates
    }

    // Kick enrichment (idempotent)
    let linked = 0;
    try {
      linked = await enrichApplianceTasks({ prisma, catalogId: catalog.id });
    } catch (e) {
      await prisma.taskGenerationIssue
        .create({
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
        })
        .catch(() => {});
    }

    // Return any existing linked templates (for UI hints)
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
