// dwellwell-api/src/routes/admin/users.ts
import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { hashPassword } from '../../utils/auth';

const router = Router();

/**
 * GET /api/admin/users
 * Optional query: ?q=<email contains>&take=50&skip=0
 */
router.get('/', async (req, res) => {
  const q = (req.query.q as string) || '';
  const take = Math.min(Number(req.query.take ?? 50), 200);
  const skip = Math.max(Number(req.query.skip ?? 0), 0);

  const where = q
    ? { email: { contains: q, mode: 'insensitive' as const } }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: { id: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ items, total, take, skip });
});

/**
 * POST /api/admin/users
 * body: { email: string, password: string, role?: 'user'|'admin' }
 */
router.post('/', async (req, res) => {
  const { email, password, role = 'user' } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'VALIDATION_FAILED' });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'EMAIL_IN_USE' });

  const pwd = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash: pwd, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json(user);
});

/**
 * PUT /api/admin/users/:userId
 * body: { email?: string, role?: string }
 */
router.put('/:userId', async (req, res) => {
  const { userId } = req.params as any;
  const { email, role } = req.body ?? {};
  const data: any = {};
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, role: true, createdAt: true },
  });

  res.json(user);
});

/**
 * POST /api/admin/users/:userId/password
 * body: { password: string }
 */
router.post('/:userId/password', async (req, res) => {
  const { userId } = req.params as any;
  const { password } = req.body ?? {};
  if (!password) return res.status(400).json({ error: 'VALIDATION_FAILED' });

  const pwd = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: pwd },
  });

  res.json({ ok: true });
});

/**
 * DELETE /api/admin/users/:userId
 */
router.delete('/:userId', async (req, res) => {
  const { userId } = req.params as any;

  // Optional: safety check to prevent self-delete or last admin delete
  // Implement if needed.

  await prisma.user.delete({ where: { id: userId } });
  res.json({ ok: true });
});

export default router;
