// dwellwell-api/src/routes/admin/users.ts
import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = express.Router();

// Admin-only
router.use(requireAuth, requireAdmin);

/** Split "name" into first/last if provided */
function splitName(full?: string): { firstName?: string; lastName?: string } {
  const n = (full || '').trim();
  if (!n) return {};
  const parts = n.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  const firstName = parts.shift()!;
  const lastName = parts.join(' ');
  return { firstName, lastName };
}

/**
 * GET /api/admin/users
 * Returns users with profile (incl. timezone) + default home summary.
 * Optional ?q= search (email or first/last name).
 */
router.get('/', async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { profile: { is: { firstName: { contains: q, mode: 'insensitive' } } } },
            { profile: { is: { lastName: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : undefined,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      defaultHomeId: true,
      defaultHome: {
        select: { id: true, address: true, city: true, state: true },
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
    },
  });

  res.json(users);
});

/**
 * PUT /api/admin/users/:id
 * Allows updating:
 * - role ("user" | "admin")
 * - name / firstName / lastName / timezone / units / householdRole / diySkill (UserProfile upsert)
 */
router.put('/:id', async (req, res) => {
  const id = req.params.id;

  const {
    role,
    name,
    firstName: rawFirstName,
    lastName: rawLastName,
    timezone,
    units,
    householdRole,
    diySkill,
  } = req.body as {
    role?: 'user' | 'admin' | string;
    name?: string;
    firstName?: string;
    lastName?: string;
    timezone?: string;
    units?: 'imperial' | 'metric';
    householdRole?: 'owner' | 'renter' | 'property_manager';
    diySkill?: 'none' | 'beginner' | 'intermediate' | 'pro';
  };

  const data: any = {};
  if (role === 'user' || role === 'admin') data.role = role;

  // Derive names from single "name" if provided
  const derived = splitName(name);
  const firstName = (rawFirstName ?? derived.firstName)?.trim();
  const lastName = (rawLastName ?? derived.lastName)?.trim();

  // Profile upsert (includes timezone + enums)
  const wantsProfileUpdate =
    firstName !== undefined ||
    lastName !== undefined ||
    timezone !== undefined ||
    units !== undefined ||
    householdRole !== undefined ||
    diySkill !== undefined;

  if (wantsProfileUpdate) {
    data.profile = {
      upsert: {
        create: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
          ...(timezone !== undefined ? { timezone } : {}),
          ...(units !== undefined ? { units } : {}),
          ...(householdRole !== undefined ? { householdRole } : {}),
          ...(diySkill !== undefined ? { diySkill } : {}),
        },
        update: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
          ...(timezone !== undefined ? { timezone } : {}),
          ...(units !== undefined ? { units } : {}),
          ...(householdRole !== undefined ? { householdRole } : {}),
          ...(diySkill !== undefined ? { diySkill } : {}),
        },
      },
    };
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      defaultHomeId: true,
      defaultHome: {
        select: { id: true, address: true, city: true, state: true },
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
    },
  });

  res.json(updated);
});

/**
 * POST /api/admin/users
 * Minimal create (invite-style). Adds role; profile can be set later.
 */
router.post('/', async (req, res) => {
  const { email, role } = req.body as { email?: string; role?: string };
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already exists' });

  const created = await prisma.user.create({
    data: {
      email,
      password: '', // invite flow placeholder
      role: role === 'admin' ? 'admin' : 'user',
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      defaultHomeId: true,
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
    },
  });

  res.status(201).json(created);
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
