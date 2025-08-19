//dwellwell-api/src/routes/admin/users.ts
import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = express.Router();

router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/users
 * Optional query: ?q=searchTerm
 */
router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' }, // safe even if updatedAt isn't generated everywhere
  });

  res.json(users);
});

/**
 * POST /api/admin/users
 * body: { email: string; name?: string; role?: 'user'|'admin'; isActive?: boolean }
 */
router.post('/', async (req, res) => {
  const { email, name, role, isActive } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'email is required' });
  }

  const data: any = { email };
  if (typeof name === 'string') data.name = name;
  if (role === 'user' || role === 'admin') data.role = role;
  if (typeof isActive === 'boolean') data.isActive = isActive;

  const created = await prisma.user.create({ data });
  res.json(created);
});

/**
 * PUT /api/admin/users/:id
 * body: { name?, role?, isActive? } – only provided fields will be changed
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, isActive } = req.body || {};

  const data: any = {};
  if (typeof name === 'string') data.name = name;
  if (role === 'user' || role === 'admin') data.role = role;
  if (typeof isActive === 'boolean') data.isActive = isActive;

  const updated = await prisma.user.update({
    where: { id },
    data,
  });
  res.json(updated);
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
