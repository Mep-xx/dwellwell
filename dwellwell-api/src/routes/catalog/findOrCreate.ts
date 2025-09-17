//dwellwell-api/src/routes/catalog/findOrCreate.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const { brand, model, type, category, imageUrl, notes } = (req.body ?? {});
  if (!brand || !model) return res.status(400).json({ error: 'BRAND_MODEL_REQUIRED' });

  const brandNorm = String(brand).trim();
  const modelNorm = String(model).trim();

  const existing = await prisma.applianceCatalog.findFirst({ where: { brand: brandNorm, model: modelNorm } });
  if (existing) {
    const patch: any = {};
    if (!existing.type && type) patch.type = String(type).toLowerCase();
    if (!existing.category && category) patch.category = String(category).toLowerCase();
    if (!existing.imageUrl && imageUrl) patch.imageUrl = String(imageUrl);
    if (!existing.notes && notes) patch.notes = String(notes);

    const out = Object.keys(patch).length
      ? await prisma.applianceCatalog.update({ where: { id: existing.id }, data: patch })
      : existing;
    return res.json(out);
  }

  const created = await prisma.applianceCatalog.create({
    data: {
      brand: brandNorm,
      model: modelNorm,
      type: (type ?? 'general').toLowerCase(),
      category: (category ?? 'general').toLowerCase(),
      imageUrl: imageUrl || null,
      notes: notes || null,
    },
  });

  res.status(201).json(created);
});
