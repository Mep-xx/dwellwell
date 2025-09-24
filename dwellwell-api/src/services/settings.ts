// dwellwell-api/src/services/settings.ts
import { prisma } from '../db/prisma';

/**
 * Ensure a user has baseline settings + preferences.
 */
export async function ensureDefaults(userId: string) {
  // --------------------------------------------------------------------------
  // CommunicationPreferences (always exists for each user)
  // --------------------------------------------------------------------------
  await prisma.communicationPreferences.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      emailEnabled: true,
      pushEnabled: false,
      reminderLeadDays: 3,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    },
  });

  // --------------------------------------------------------------------------
  // UserSettings (theme, gamification, integrations, etc.)
  // --------------------------------------------------------------------------
  await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      theme: 'SYSTEM',
      accentColor: '#4f46e5',
      fontScale: 1.0,
      gamificationEnabled: true,
      gamificationVisibility: 'PRIVATE',
      retainDeletedTrackableStats: true,
      defaultDaysBeforeDue: 2,
      autoAssignRoomTasks: true,
      allowTaskDisable: true,
      allowTaskDelete: true,
      googleCalendarEnabled: false,
      icalFeedToken: crypto.randomUUID(),
    },
  });

  // --------------------------------------------------------------------------
  // NotificationPreferences (seed a minimal global set)
  // NOTE: can't use upsert with composite key when homeId/trackableId are null
  // --------------------------------------------------------------------------
  const seed = [
    {
      event: 'TASK_DUE_SOON',
      channel: 'EMAIL',
      enabled: true,
      frequency: 'IMMEDIATE',
    },
    {
      event: 'TASK_OVERDUE',
      channel: 'EMAIL',
      enabled: true,
      frequency: 'IMMEDIATE',
    },
    {
      event: 'WEEKLY_DIGEST',
      channel: 'EMAIL',
      enabled: true,
      frequency: 'WEEKLY_DIGEST',
    },
  ] as const;

  for (const p of seed) {
    const existing = await prisma.notificationPreference.findFirst({
      where: {
        userId,
        event: p.event as any,
        channel: p.channel as any,
        homeId: null,
        trackableId: null,
      },
    });

    if (!existing) {
      await prisma.notificationPreference.create({
        data: {
          userId,
          event: p.event as any,
          channel: p.channel as any,
          enabled: p.enabled,
          frequency: p.frequency as any,
          homeId: null,
          trackableId: null,
        },
      });
    } else {
      // Optionally: keep them synced with defaults
      await prisma.notificationPreference.update({
        where: { id: existing.id },
        data: {
          enabled: p.enabled,
          frequency: p.frequency as any,
        },
      });
    }
  }
}
