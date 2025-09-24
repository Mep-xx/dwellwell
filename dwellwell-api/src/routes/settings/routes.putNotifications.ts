//dwellwell-api/src/routes/settings/routes.putNotifications.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';
import { z } from 'zod';

const PrefSchema = z.object({
  event: z.enum([
    'TASK_DUE_SOON','TASK_OVERDUE','WEEKLY_DIGEST',
    'NEW_TASKS_ADDED','TRACKABLE_MILESTONE','GAMIFICATION_LEVEL_UP'
  ]),
  channel: z.enum(['EMAIL','PUSH','SMS']),
  enabled: z.boolean(),
  frequency: z.enum(['IMMEDIATE','DAILY_DIGEST','WEEKLY_DIGEST']),
  homeId: z.string().nullable().optional(),
  trackableId: z.string().nullable().optional(),
});
const PrefArray = z.array(PrefSchema).max(100);

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;
  const list = PrefArray.parse(req.body ?? []);
  const ops = list.map(p =>
    prisma.notificationPreference.upsert({
      where: {
        userId_event_channel_homeId_trackableId: {
          userId,
          event: p.event,
          channel: p.channel,
          homeId: p.homeId ?? null,
          trackableId: p.trackableId ?? null,
        }
      },
      create: { userId, ...p },
      update: { enabled: p.enabled, frequency: p.frequency }
    })
  );
  const out = await prisma.$transaction(ops);
  res.json(out);
});
