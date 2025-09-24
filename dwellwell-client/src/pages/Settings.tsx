// dwellwell-client/src/pages/Settings.tsx
import { useEffect, useState } from 'react';
import {
  fetchSettings,
  updateSettings,
  updateNotificationPrefs,
  rotateIcalToken,
} from "@/utils/settings";
import type {
  NotificationPreference,
  SettingsBundle,
  UserSettings,
  NotificationFrequency,
  NotificationChannel,
  NotificationEvent,
} from '@/types/settings';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as React from 'react';

export default function SettingsPage() {
  const [bundle, setBundle] = useState<SettingsBundle | null>(null);
  const [local, setLocal] = useState<UserSettings | null>(null);
  const [notifLocal, setNotifLocal] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  async function load() {
    setIsLoading(true);
    setErr(null);
    try {
      const data = await fetchSettings();
      setBundle(data);
      setLocal(data.settings);
      setNotifLocal(data.notificationPrefs);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings(next: UserSettings) {
    setSavingSettings(true);
    setErr(null);
    try {
      const updated = await updateSettings(next);
      setLocal(updated);
      setBundle((prev) => (prev ? { ...prev, settings: updated } : prev));
    } catch (e: any) {
      setErr(e?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveNotifs() {
    setSavingNotifs(true);
    setErr(null);
    try {
      const updated = await updateNotificationPrefs(notifLocal);
      setNotifLocal(updated);
    } catch (e: any) {
      setErr(e?.message || 'Failed to save notification preferences');
    } finally {
      setSavingNotifs(false);
    }
  }

  async function handleRotateIcal() {
    setErr(null);
    try {
      const token = await rotateIcalToken();
      setBundle((prev) =>
        prev
          ? { ...prev, settings: { ...prev.settings, icalFeedToken: token } }
          : prev
      );
    } catch (e: any) {
      setErr(e?.message || 'Failed to rotate iCal token');
    }
  }

  if (isLoading || !bundle || !local)
    return <div className="p-6">Loading settings…</div>;

  const s = local;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      {err && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{err}</div>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <Select
                value={s.theme}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setLocal({
                    ...s,
                    theme: e.target.value as UserSettings['theme'],
                  })
                }
              >
                <option value="SYSTEM">System</option>
                <option value="LIGHT">Light</option>
                <option value="DARK">Dark</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Accent</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <SwatchPicker
                  value={s.accentColor}
                  onChange={(hex) => setLocal({ ...s, accentColor: hex })}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Custom</span>
                  <Input
                    type="color"
                    value={s.accentColor}
                    onChange={(e) =>
                      setLocal({ ...s, accentColor: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Font scale</label>
              <Input
                type="number"
                min="0.75"
                max="1.5"
                step="0.05"
                value={s.fontScale}
                onChange={(e) =>
                  setLocal({
                    ...s,
                    fontScale: parseFloat(e.target.value || '1'),
                  })
                }
              />
            </div>
          </div>
          <Button onClick={() => saveSettings(s)} disabled={savingSettings}>
            Save Appearance
          </Button>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks & Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Auto-assign room tasks"
            value={s.autoAssignRoomTasks}
            onChange={(v) => setLocal({ ...s, autoAssignRoomTasks: v })}
          />
          <ToggleRow
            label="Allow task disable"
            value={s.allowTaskDisable}
            onChange={(v) => setLocal({ ...s, allowTaskDisable: v })}
          />
          <ToggleRow
            label="Allow task delete"
            value={s.allowTaskDelete}
            onChange={(v) => setLocal({ ...s, allowTaskDelete: v })}
          />
          <div>
            <label className="text-sm font-medium">
              Default reminder lead (days)
            </label>
            <Input
              type="number"
              min="0"
              max="30"
              value={s.defaultDaysBeforeDue}
              onChange={(e) =>
                setLocal({
                  ...s,
                  defaultDaysBeforeDue: parseInt(e.target.value || '0', 10),
                })
              }
            />
          </div>
          <Button onClick={() => saveSettings(s)} disabled={savingSettings}>
            Save Task Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Gamification */}
      <Card>
        <CardHeader>
          <CardTitle>Gamification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Enable gamification"
            value={s.gamificationEnabled}
            onChange={(v) => setLocal({ ...s, gamificationEnabled: v })}
          />
          <div>
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={s.gamificationVisibility}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setLocal({
                  ...s,
                  gamificationVisibility:
                    e.target.value as UserSettings['gamificationVisibility'],
                })
              }
            >
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
              <option value="HIDDEN_UI_KEEP_STATS">
                Hidden (keep stats)
              </option>
            </Select>
          </div>
          <ToggleRow
            label="Retain anonymized stats for deleted trackables"
            value={s.retainDeletedTrackableStats}
            onChange={(v) =>
              setLocal({ ...s, retainDeletedTrackableStats: v })
            }
          />
          <Button onClick={() => saveSettings(s)} disabled={savingSettings}>
            Save Gamification
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <NotificationsMatrix
        prefs={notifLocal}
        setPrefs={setNotifLocal}
        onSave={saveNotifs}
        emailOnly
        saving={savingNotifs}
      />

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Enable Google Calendar"
            value={s.googleCalendarEnabled}
            onChange={(v) => setLocal({ ...s, googleCalendarEnabled: v })}
          />
          <div className="flex items-center gap-2">
            <Button onClick={() => saveSettings(s)} disabled={savingSettings}>
              Save
            </Button>
            <Button variant="secondary" onClick={handleRotateIcal}>
              Rotate iCal URL
            </Button>
          </div>
          {bundle.settings.icalFeedToken && (
            <div className="text-sm">
              iCal URL:{' '}
              <code>{`${window.location.origin}/ical/${bundle.settings.icalFeedToken}.ics`}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function NotificationsMatrix({
  prefs,
  setPrefs,
  onSave,
  emailOnly,
  saving,
}: {
  prefs: NotificationPreference[];
  setPrefs: React.Dispatch<React.SetStateAction<NotificationPreference[]>>;
  onSave: () => void;
  emailOnly?: boolean;
  saving?: boolean;
}) {
  const events: { key: NotificationEvent; label: string }[] = [
    { key: 'TASK_DUE_SOON', label: 'Task due soon' },
    { key: 'TASK_OVERDUE', label: 'Task overdue' },
    { key: 'WEEKLY_DIGEST', label: 'Weekly digest' },
    { key: 'NEW_TASKS_ADDED', label: 'New tasks added' },
    { key: 'TRACKABLE_MILESTONE', label: 'Trackable milestone' },
    { key: 'GAMIFICATION_LEVEL_UP', label: 'Level up' },
  ];

  const channels: { key: NotificationChannel; label: string }[] = [
    { key: 'EMAIL', label: 'Email' },
    { key: 'PUSH', label: 'Push' },
    { key: 'SMS', label: 'SMS' },
  ];

  const freqs: NotificationFrequency[] = [
    'IMMEDIATE',
    'DAILY_DIGEST',
    'WEEKLY_DIGEST',
  ];

  function getPref(
    event: NotificationEvent,
    channel: NotificationChannel
  ): NotificationPreference {
    return (
      prefs.find(
        (p) =>
          p.event === event &&
          p.channel === channel &&
          !p.homeId &&
          !p.trackableId
      ) ?? {
        event,
        channel,
        enabled: false,
        frequency: 'IMMEDIATE',
        homeId: null,
        trackableId: null,
      }
    );
  }

  function setPref(np: NotificationPreference) {
    setPrefs((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.event === np.event &&
          p.channel === np.channel &&
          !p.homeId &&
          !p.trackableId
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = np;
        return copy;
      }
      return [...prev, np];
    });
  }

  const channelEnabled = (c: NotificationChannel) =>
    emailOnly ? c === 'EMAIL' : true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Event</th>
                {channels.map((ch) => (
                  <th key={ch.key} className="p-2">
                    {ch.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.key} className="border-t">
                  <td className="p-2">{ev.label}</td>
                  {channels.map((ch) => {
                    const p = getPref(ev.key, ch.key);
                    return (
                      <td key={ch.key} className="p-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            disabled={!channelEnabled(ch.key)}
                            checked={!!p.enabled && channelEnabled(ch.key)}
                            onCheckedChange={(v) =>
                              setPref({ ...p, enabled: v })
                            }
                          />
                          <Select
                            disabled={!channelEnabled(ch.key)}
                            value={p.frequency}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              setPref({
                                ...p,
                                frequency: e.target
                                  .value as NotificationFrequency,
                              })
                            }
                          >
                            {freqs.map((f) => (
                              <option key={f} value={f}>
                                {f.replace('_', ' ')}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={onSave} disabled={saving}>
          Save Notifications
        </Button>
      </CardContent>
    </Card>
  );
}

// Swatch picker for accent colors
function SwatchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const SWATCHES: { name: string; hex: string }[] = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Cyan', hex: '#0891b2' },
    { name: 'Teal', hex: '#0d9488' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Amber', hex: '#d97706' },
    { name: 'Rose', hex: '#e11d48' },
    { name: 'Purple', hex: '#7c3aed' },
    { name: 'Slate', hex: '#475569' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((s) => {
        const selected = value.toLowerCase() === s.hex.toLowerCase();
        return (
          <button
            key={s.hex}
            type="button"
            aria-label={s.name}
            title={s.name}
            onClick={() => onChange(s.hex)}
            className={`relative h-8 w-8 rounded-full border transition ${
              selected ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:opacity-90'
            }`}
            style={{
              backgroundColor: s.hex,
              borderColor: 'rgba(0,0,0,0.08)',
            }}
          >
            {selected && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
