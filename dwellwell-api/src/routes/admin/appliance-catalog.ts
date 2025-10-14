import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";
import { Prisma } from "@prisma/client";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET list (simple filters)
router.get("/", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const take = Math.min(Math.max(parseInt(String(req.query.take ?? "100"), 10) || 100, 1), 500);

  const where: Prisma.ApplianceCatalogWhereInput | undefined = q
    ? {
        OR: [
          { brand: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { model: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { type: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { category: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : undefined;

  const items = (await prisma.applianceCatalog.findMany({
    where,
    take,
    orderBy: [{ brand: "asc" }, { model: "asc" }],
    include: {
      applianceTaskTemplates: { include: { taskTemplate: true } },
      trackables: { select: { id: true } },
    },
  })) as Array<
    Prisma.ApplianceCatalogGetPayload<{
      include: {
        applianceTaskTemplates: { include: { taskTemplate: true } };
        trackables: { select: { id: true } };
      };
    }>
  >;

  res.json(
    items.map((c) => ({
      id: c.id,
      brand: c.brand,
      model: c.model,
      type: c.type,
      category: c.category,
      notes: c.notes,
      imageUrl: c.imageUrl,
      linkedTemplates: c.applianceTaskTemplates.map((l: { taskTemplate: { id: string; title: string; recurrenceInterval: string } }) => ({
        id: l.taskTemplate.id,
        title: l.taskTemplate.title,
        recurrenceInterval: l.taskTemplate.recurrenceInterval,
      })),
      trackablesCount: c.trackables.length,
      createdAt: c.createdAt,
    }))
  );
});

// GET single by id (used by Enrich modal hydration)
router.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const c = await prisma.applianceCatalog.findUnique({
    where: { id },
    include: {
      applianceTaskTemplates: { include: { taskTemplate: true } },
      trackables: { select: { id: true } },
    },
  });
  if (!c) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({
    id: c.id,
    brand: c.brand,
    model: c.model,
    type: c.type,
    category: c.category,
    notes: c.notes,
    imageUrl: c.imageUrl,
    linkedTemplates: c.applianceTaskTemplates.map((l) => ({
      id: l.taskTemplate.id,
      title: l.taskTemplate.title,
      recurrenceInterval: l.taskTemplate.recurrenceInterval,
    })),
    trackablesCount: c.trackables.length,
    createdAt: c.createdAt,
  });
});

// CREATE new catalog row
router.post("/", async (req: Request, res: Response) => {
  const { brand, model, type, category, notes, imageUrl } = (req.body ?? {}) as {
    brand?: string;
    model?: string;
    type?: string | null;
    category?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
  };

  if (!brand?.trim() || !model?.trim()) {
    return res.status(400).json({ error: "VALIDATION_FAILED", message: "brand and model are required" });
  }

  // uniqueness on (brand, model) — assumes a unique index brand_model exists
  const exists = await prisma.applianceCatalog.findUnique({
    where: { brand_model: { brand: brand.trim(), model: model.trim() } },
    select: { id: true },
  });
  if (exists) {
    return res.status(409).json({ error: "ALREADY_EXISTS", id: exists.id });
  }

  // Prisma expects non-null strings for type/category in your schema; coerce sensible defaults.
  const created = await prisma.applianceCatalog.create({
    data: {
      brand: brand.trim(),
      model: model.trim(),
      type: typeof type === "string" ? type.trim() : "",           // <- string, not null
      category: typeof category === "string" ? category.trim() : "general", // <- string, not null
      notes: typeof notes === "string" ? notes : null,
      imageUrl: typeof imageUrl === "string" ? imageUrl : null,
    },
  });

  res.status(201).json(created);
});

// UPDATE basic fields
router.put("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { type, category, notes, imageUrl } = (req.body ?? {}) as {
    type?: string | null;
    category?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
  };

  const updated = await prisma.applianceCatalog.update({
    where: { id },
    data: {
      // If your schema requires non-null strings, coerce to empty/defaults when client sends null
      type: typeof type === "string" ? type : undefined,
      category: typeof category === "string" ? category : undefined,
      notes: typeof notes === "string" ? notes : undefined,
      imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
    },
  });
  res.json(updated);
});

// DELETE with conflict guard
router.delete("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const count = await prisma.trackable.count({ where: { applianceCatalogId: id } });
  if (count > 0) {
    return res.status(409).json({ error: "IN_USE", trackablesCount: count });
  }
  await prisma.applianceCatalog.delete({ where: { id } });
  res.json({ ok: true });
});

// Re-run enrichment for this catalog row (idempotent)
router.post("/:id/enrich", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { enrichApplianceTasks } = await import("../../services/taskgen/enrichApplianceTasks");
  const linked = await enrichApplianceTasks({ prisma, catalogId: id });
  res.json({ linked });
});

export default router;
