// dwellwell-api/src/routes/adminWhatsNew.ts
import { Router } from 'express';
import { prisma } from '../db/prisma';
const router = Router();
// router.use(requireAdmin);

router.get('/', async (_req, res) => {
  const items = await prisma.whatsNew.findMany({ orderBy: { createdAt: 'desc' }});
  res.json(items);
});

router.post('/', async (req, res) => {
  const { title, description, published } = req.body;
  const created = await prisma.whatsNew.create({ data: { title, description, published: !!published } });
  res.json(created);
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.whatsNew.update({ where: { id }, data: req.body });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.whatsNew.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
