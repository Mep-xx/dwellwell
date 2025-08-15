import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = express.Router();

// Stack middlewares: requireAuth first, then requireAdmin
router.use(requireAuth, requireAdmin);

router.get('/', async (req, res) => {
  const templates = await prisma.taskTemplate.findMany({ orderBy: { title: 'asc' } });
  res.json(templates);
});

router.post('/', async (req, res) => {
  const task = await prisma.taskTemplate.create({ data: req.body });
  res.status(201).json(task);
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
  res.status(204).end();
});

export default router;
