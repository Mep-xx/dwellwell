// dwellwell-api/src/routes/settings/update-notifications.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

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

  const results = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const out: any[] = [];
    for (const p of list) {
      const existing = await tx.notificationPreference.findFirst({
        where: {
          userId,
          event: p.event,
          channel: p.channel,
          homeId: p.homeId ?? null,
          trackableId: p.trackableId ?? null,
        },
      });

      if (existing) {
        out.push(
          await tx.notificationPreference.update({
            where: { id: existing.id },
            data: { enabled: p.enabled, frequency: p.frequency },
          })
        );
      } else {
        out.push(
          await tx.notificationPreference.create({
            data: {
              userId,
              event: p.event,
              channel: p.channel,
              enabled: p.enabled,
              frequency: p.frequency,
              homeId: p.homeId ?? null,
              trackableId: p.trackableId ?? null,
            },
          })
        );
      }
    }
    return out;
  });

  res.json(results);
});
