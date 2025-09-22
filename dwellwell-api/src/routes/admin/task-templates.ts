//dwellwell-api/src/routes/admin/task-templates.ts
import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Keep orderBy stable even if your generated Prisma client
// hasn't picked up `updatedAt` yet.
router.get('/', async (_req, res) => {
  const rows = await prisma.taskTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows);
});

router.post('/', async (req, res) => {
  const created = await prisma.taskTemplate.create({ data: req.body });
  res.json(created);
});

router.put('/:id', async (req, res) => {
  const updated = await prisma.taskTemplate.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await prisma.taskTemplate.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
