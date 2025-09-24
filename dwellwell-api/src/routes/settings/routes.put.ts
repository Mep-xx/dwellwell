//dwellwell-api/src/routes/settings/routes.put.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';
import { z } from 'zod';

const SettingsSchema = z.object({
  theme: z.enum(['LIGHT','DARK','SYSTEM']).optional(),
  accentColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).optional(),
  fontScale: z.number().min(0.75).max(1.5).optional(),

  gamificationEnabled: z.boolean().optional(),
  gamificationVisibility: z.enum(['PRIVATE','PUBLIC','HIDDEN_UI_KEEP_STATS']).optional(),
  retainDeletedTrackableStats: z.boolean().optional(),

  defaultDaysBeforeDue: z.number().int().min(0).max(30).optional(),
  autoAssignRoomTasks: z.boolean().optional(),
  allowTaskDisable: z.boolean().optional(),
  allowTaskDelete: z.boolean().optional(),

  googleCalendarEnabled: z.boolean().optional(),
});

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;
  const body = SettingsSchema.parse(req.body ?? {});
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: body,
    create: { userId, ...body, icalFeedToken: crypto.randomUUID() },
  });
  res.json({ settings });
});
