//dwellwell-client/src/utils/settings.ts
import { api } from '@/utils/api';
import type { SettingsBundle, UserSettings, NotificationPreference } from '@/types/settings';

export async function fetchSettings(): Promise<SettingsBundle> {
  const { data } = await api.get('/settings');
  return data;
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const { data } = await api.put('/settings', patch);
  return data.settings as UserSettings;
}

export async function getNotificationPrefs(): Promise<NotificationPreference[]> {
  const { data } = await api.get('/settings/notifications');
  return data as NotificationPreference[];
}

export async function updateNotificationPrefs(prefs: NotificationPreference[]): Promise<NotificationPreference[]> {
  const { data } = await api.put('/settings/notifications', prefs);
  return data as NotificationPreference[];
}

export async function rotateIcalToken(): Promise<string> {
  const { data } = await api.post('/settings/ical/rotate', {});
  return data.icalFeedToken as string;
}
