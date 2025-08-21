import { Router } from 'express';
import { prisma } from '../../db/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

const router = Router();

// If you have auth/role guards, enable them here
// import { requireAuth } from '../../middleware/requireAuth';
// import { requireAdmin } from '../../middleware/requireAdmin';
// router.use(requireAuth, requireAdmin);

/**
 * Common SELECT shape used by list + read after update.
 * Sticks to `select` only (no `include`).
 */
const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  defaultHomeId: true,
  defaultHome: {
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
    },
  },
  profile: {
    select: {
      firstName: true,
      lastName: true,
      timezone: true,
      units: true,
      householdRole: true,
      diySkill: true,
    },
  },
} as const;

/**
 * GET /api/admin/users
 * ?q= (email/first/last)
 */
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();

    let where: Prisma.UserWhereInput | undefined;
    if (q) {
      const insensitive = Prisma.QueryMode.insensitive;
      where = {
        OR: [
          { email: { contains: q, mode: insensitive } },
          { profile: { is: { firstName: { contains: q, mode: insensitive } } } },
          { profile: { is: { lastName: { contains: q, mode: insensitive } } } },
        ],
      };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    });

    res.json(users);
  } catch (e) {
    console.error('GET /api/admin/users failed:', e);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users
 * body: { email: string, role?: 'user'|'admin', password?: string }
 * - Satisfies required `password` with a secure random if one isn’t provided.
 * - Also creates an empty profile via nested write.
 */
router.post('/', async (req, res) => {
  try {
    const { email, role, password } = req.body as {
      email?: string;
      role?: string;
      password?: string;
    };

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const rawPassword =
      (typeof password === 'string' && password.length >= 8 ? password : null) ??
      crypto.randomBytes(24).toString('base64url'); // strong random

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const created = await prisma.user.create({
      data: {
        email: email.trim(),
        role: role === 'admin' ? 'admin' : 'user',
        password: passwordHash,
        profile: { create: {} },
      },
      select: userSelect,
    });

    res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    console.error('POST /api/admin/users failed:', e);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

/**
 * PUT /api/admin/users/:id
 * body: {
 *   role?: 'user'|'admin',
 *   firstName?, lastName?, timezone?, units?, householdRole?, diySkill?
 * }
 * - Uses nested upsert on user.profile (no prisma.profile accessor needed).
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      role,
      firstName,
      lastName,
      timezone,
      units,
      householdRole,
      diySkill,
    } = req.body as {
      role?: 'user' | 'admin' | string;
      firstName?: string;
      lastName?: string;
      timezone?: string;
      units?: 'imperial' | 'metric';
      householdRole?: 'owner' | 'renter' | 'property_manager';
      diySkill?: 'none' | 'beginner' | 'intermediate' | 'pro';
    };

    const data: Prisma.UserUpdateInput = {};

    if (role) {
      data.role = role === 'admin' ? 'admin' : 'user';
    }

    data.profile = {
      upsert: {
        update: {
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
          timezone: timezone ?? undefined,
          // casts tolerate enum typing differences in your schema
          units: (units as any) ?? undefined,
          householdRole: (householdRole as any) ?? undefined,
          diySkill: (diySkill as any) ?? undefined,
        },
        create: {
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          timezone: timezone ?? null,
          units: (units as any) ?? null,
          householdRole: (householdRole as any) ?? null,
          diySkill: (diySkill as any) ?? null,
        },
      },
    };

    await prisma.user.update({
      where: { id },
      data,
      select: { id: true },
    });

    const updated = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    res.json(updated);
  } catch (e) {
    console.error('PUT /api/admin/users/:id failed:', e);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/users/:id failed:', e);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
