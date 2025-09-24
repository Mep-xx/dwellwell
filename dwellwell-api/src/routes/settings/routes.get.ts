//dwellwell-api/src/routes/settings/routes.get.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';
import { ensureDefaults } from '../../services/settings';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;
  await ensureDefaults(userId);

  const [settings, notificationPrefs, profile, comms] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.notificationPreference.findMany({ where: { userId } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.communicationPreferences.findUnique({ where: { userId } }),
  ]);

  res.json({
    settings,
    notificationPrefs,
    profile,            // FYI: timezone/units may live here already per your schema
    communication: comms // emailEnabled, pushEnabled, reminderLeadDays, quietHours
  });
});
