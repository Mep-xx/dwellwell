// dwellwell-api/src/routes/admin/appliance-catalog.ts
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

// PUT update basic fields
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
      type: typeof type === "string" ? type : undefined,
      category: typeof category === "string" ? category : undefined,
      notes: typeof notes === "string" ? notes : undefined,
      imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
    },
  });
  res.json(updated);
});

// POST relink: re-run enrichment for this catalog row (idempotent)
router.post("/:id/enrich", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { enrichApplianceTasks } = await import("../../services/taskgen/enrichApplianceTasks");
  const linked = await enrichApplianceTasks({ prisma, catalogId: id });
  res.json({ linked });
});

export default router;
