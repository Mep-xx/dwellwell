// dwellwell-client/src/pages/Settings.tsx
import * as React from "react";
import { useEffect, useRef, useState } from "react";

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
} from "@/types/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useTheme } from "@/context/ThemeContext";
import { THEME_CHOICES } from "@/theme/themes";
import { THEME_SWATCHES } from "@/theme/swatches";

// mirror to localStorage used by Dashboard
import { setTaskDetailPref } from "@/hooks/useTaskDetailPref";

/* ---------------- helpers ---------------- */
function toCtxMode(m: UserSettings["theme"]): "system" | "light" | "dark" {
  if (m === "LIGHT") return "light";
  if (m === "DARK") return "dark";
  return "system";
}
function toServerMode(m: "system" | "light" | "dark"): UserSettings["theme"] {
  if (m === "light") return "LIGHT";
  if (m === "dark") return "DARK";
  return "SYSTEM";
}

/* ============================================================================ */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [bundle, setBundle] = useState<SettingsBundle | null>(null);
  const [local, setLocal] = useState<UserSettings | null>(null);
  const [notifLocal, setNotifLocal] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // style family is only client-side for now
  const [family, setFamily] = useState(theme.style);

  useEffect(() => {
    let alive = true;
    (async () => {
      setIsLoading(true);
      setErr(null);
      try {
        const data = await fetchSettings();
        if (!alive) return;

        // Normalize + mirror to localStorage immediately
        const normalized: UserSettings = {
          ...data.settings,
          taskDetailView: data.settings.taskDetailView ?? "drawer",
        };
        if (normalized.taskDetailView === "drawer" || normalized.taskDetailView === "card") {
          setTaskDetailPref(normalized.taskDetailView);
        }

        setBundle(data);
        setLocal(normalized);
        setNotifLocal(data.notificationPrefs);

        // ----- IMPORTANT: don't clobber a user-chosen theme restored from localStorage -----
        // If there is NO saved v2 or the current local mode is "system", let the server pick.
        const saved = (() => {
          try {
            return JSON.parse(localStorage.getItem("dwellwell.theme.v2") || "null");
          } catch {
            return null;
          }
        })();

        const serverMode = toCtxMode(normalized.theme);

        if (!saved || theme.mode === "system") {
          setTheme({
            mode: serverMode,
            style: theme.style ?? "default",
          });
        }
        setFamily(theme.style ?? "default");
      } catch (e: any) {
        setErr(e?.message || "Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setFamily(theme.style), [theme.style]);

  // Instant save helper (partial patch)
  async function instantSave(patch: Partial<UserSettings>) {
    if (!local) return;
    setErr(null);
    try {
      const nextLocal = { ...local, ...patch };
      setLocal(nextLocal);
      const updated = await updateSettings(patch);
      setLocal(updated);
      setBundle((prev) => (prev ? { ...prev, settings: updated } : prev));

      // reflect theme & drawer/card to the client immediately
      setTheme({ mode: toCtxMode(updated.theme), style: family });
      if (typeof updated.taskDetailView !== "undefined") {
        const v = updated.taskDetailView;
        if (v === "drawer" || v === "card") setTaskDetailPref(v);
      }
    } catch (e: any) {
      setErr(e?.message || "Failed to save settings");
    }
  }

  // debounce for numeric input
  const debounceRef = useRef<number | null>(null);
  function debouncedSave(patch: Partial<UserSettings>, delay = 350) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      instantSave(patch);
    }, delay);
  }

  async function saveNotifs() {
    setErr(null);
    try {
      const updated = await updateNotificationPrefs(notifLocal);
      setNotifLocal(updated);
    } catch (e: any) {
      setErr(e?.message || "Failed to save notification preferences");
    }
  }

  async function handleRotateIcal() {
    setErr(null);
    try {
      const token = await rotateIcalToken();
      setBundle((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, icalFeedToken: token } } : prev
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to rotate iCal token");
    }
  }

  if (isLoading || !bundle || !local) {
    return <div className="p-6">Loading settings…</div>;
  }
  const s = local;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      {err && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="text-sm font-medium">Theme</label>
              <div className="mt-2">
                <ThemeDropdown
                  selectedId={(() => {
                    const mode = toCtxMode(s.theme);
                    const target = THEME_CHOICES.find(
                      (c) => c.mode === mode && c.style === family
                    );
                    return target?.id ?? THEME_CHOICES[0].id;
                  })()}
                  onSelect={async (id) => {
                    const choice = THEME_CHOICES.find((c) => c.id === id);
                    if (!choice) return;
                    setFamily(choice.style);
                    // Persist to server
                    await instantSave({ theme: toServerMode(choice.mode) });
                    // Reflect locally
                    setTheme({ mode: choice.mode, style: choice.style });
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks & Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <div className="text-sm font-medium">Task interaction style</div>
            <p className="text-xs text-muted">
              Choose how task details open when you click a card.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className={`rd-md ${
                  s.taskDetailView === "drawer" ? "bg-primary-soft text-primary border-primary" : ""
                }`}
                onClick={async () => {
                  const updated = await updateSettings({ taskDetailView: "drawer" });
                  setTaskDetailPref("drawer");
                  setLocal(updated);
                }}
              >
                Flyout drawer
              </Button>

              <Button
                size="sm"
                variant="secondary"
                className={`rd-md ${
                  s.taskDetailView === "card" ? "bg-primary-soft text-primary border-primary" : ""
                }`}
                onClick={async () => {
                  const updated = await updateSettings({ taskDetailView: "card" });
                  setTaskDetailPref("card");
                  setLocal(updated);
                }}
              >
                Expand in place
              </Button>
            </div>
          </section>

          <ToggleRow
            label="Auto-assign room tasks"
            value={s.autoAssignRoomTasks}
            onChange={async (v) => {
              const updated = await updateSettings({ autoAssignRoomTasks: v });
              setLocal(updated);
            }}
          />
          <ToggleRow
            label="Allow task disable"
            value={s.allowTaskDisable}
            onChange={async (v) => {
              const updated = await updateSettings({ allowTaskDisable: v });
              setLocal(updated);
            }}
          />
          <ToggleRow
            label="Allow task delete"
            value={s.allowTaskDelete}
            onChange={async (v) => {
              const updated = await updateSettings({ allowTaskDelete: v });
              setLocal(updated);
            }}
          />

          <div>
            <label className="text-sm font-medium">Default reminder lead (days)</label>
            <Input
              type="number"
              min="0"
              max="30"
              value={s.defaultDaysBeforeDue}
              onChange={async (e) => {
                const val = parseInt(e.target.value || "0", 10);
                const updated = await updateSettings({ defaultDaysBeforeDue: val });
                setLocal(updated);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <NotificationsMatrix
        prefs={notifLocal}
        setPrefs={setNotifLocal}
        onSave={saveNotifs}
        emailOnly
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
            onChange={(v) => instantSave({ googleCalendarEnabled: v })}
          />
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleRotateIcal}>
              Rotate iCal URL
            </Button>
          </div>
          {bundle.settings.icalFeedToken && (
            <div className="text-sm">
              iCal URL:{" "}
              <code>{`${window.location.origin}/ical/${bundle.settings.icalFeedToken}.ics`}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================== small UI bits =============================== */

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
}: {
  prefs: NotificationPreference[];
  setPrefs: React.Dispatch<React.SetStateAction<NotificationPreference[]>>;
  onSave: () => void;
  emailOnly?: boolean;
}) {
  const events: { key: NotificationEvent; label: string }[] = [
    { key: "TASK_DUE_SOON", label: "Task due soon" },
    { key: "TASK_OVERDUE", label: "Task overdue" },
    { key: "WEEKLY_DIGEST", label: "Weekly digest" },
    { key: "NEW_TASKS_ADDED", label: "New tasks added" },
    { key: "TRACKABLE_MILESTONE", label: "Trackable milestone" },
    { key: "GAMIFICATION_LEVEL_UP", label: "Level up" },
  ];

  const channels: { key: NotificationChannel; label: string }[] = [
    { key: "EMAIL", label: "Email" },
    { key: "PUSH", label: "Push" },
    { key: "SMS", label: "SMS" },
  ];

  const freqs: NotificationFrequency[] = ["IMMEDIATE", "DAILY_DIGEST", "WEEKLY_DIGEST"];

  function getPref(event: NotificationEvent, channel: NotificationChannel): NotificationPreference {
    return (
      prefs.find(
        (p) => p.event === event && p.channel === channel && !p.homeId && !p.trackableId
      ) ?? {
        event,
        channel,
        enabled: false,
        frequency: "IMMEDIATE",
        homeId: null,
        trackableId: null,
      }
    );
  }

  function setPref(np: NotificationPreference) {
    setPrefs((prev) => {
      const idx = prev.findIndex(
        (p) => p.event === np.event && p.channel === np.channel && !p.homeId && !p.trackableId
      );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = np;
          return copy;
        }
        return [...prev, np];
      });
    }

  const channelEnabled = (c: NotificationChannel) => (emailOnly ? c === "EMAIL" : true);

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
                            onCheckedChange={(v) => setPref({ ...p, enabled: v })}
                          />
                          <select
                            disabled={!channelEnabled(ch.key)}
                            value={p.frequency}
                            onChange={(e) =>
                              setPref({
                                ...p,
                                frequency: e.target.value as NotificationFrequency,
                              })
                            }
                            className="rounded border px-2 py-1 text-sm"
                          >
                            {freqs.map((f) => (
                              <option key={f} value={f}>
                                {f.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={onSave}>Save Notifications</Button>
      </CardContent>
    </Card>
  );
}

/* ======================= THEME DROPDOWN (mode + family) ===================== */

function ThemeDropdown({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const current = THEME_CHOICES.find((c) => c.id === selectedId);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-[360px] inline-flex items-center justify-between rounded-xl border border-token bg-surface-alt px-3 py-2 text-left hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <div className="flex items-center gap-3 min-w-0">
          {current && <SwatchRow swatch={THEME_SWATCHES[current.id]} />}
          <div className="min-w-0">
            <div className="font-medium truncate">{current?.label ?? "Choose theme"}</div>
            <div className="text-xs text-muted">Theme preview</div>
          </div>
        </div>
        <Caret />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-2 w-[420px] rounded-xl border border-token bg-card text-body p-2 shadow-xl"
        >
          <ul className="space-y-2 max-h-[60vh] overflow-auto">
            {THEME_CHOICES.map((opt) => {
              const active = selectedId === opt.id;
              const s = THEME_SWATCHES[opt.id];
              return (
                <li key={opt.id}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={async () => {
                      await onSelect(opt.id);
                      setOpen(false);
                    }}
                    className={`w-full cursor-pointer rounded-lg border p-3 text-left transition
                      ${active ? "border-primary ring-2 ring-primary" : "border-token hover:border-primary/40"}`}
                  >
                    <div className="flex items-center gap-3">
                      <SwatchRow swatch={s} />
                      <div className="min-w-0">
                        <div className="font-medium leading-tight truncate">{opt.label}</div>
                        <div className="text-xs text-muted">Theme preview</div>
                      </div>
                      {active && <Check />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============================= tiny SVGs ==================================== */
function Caret() {
  return (
    <svg className="h-4 w-4 opacity-70 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
    </svg>
  );
}
function Check() {
  return (
    <svg className="ml-auto h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 5.292a1 1 0 010 1.416l-7.25 7.25a1 1 0 01-1.415 0L3.296 9.215a1 1 0 011.415-1.415l3.03 3.03 6.542-6.541a1 1 0 011.421.003z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ========================== swatch row for preview =========================== */
function SwatchRow({
  swatch,
}: {
  swatch: { surface: string; surfaceAlt: string; primary: string; accent: string; text: string };
}) {
  const box = (c: string, title: string) => (
    <div
      title={title}
      className="h-6 w-8 rounded-md border"
      style={{ backgroundColor: c, borderColor: "rgba(0,0,0,0.15)" }}
    />
  );
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {box(swatch.surface, "surface")}
      {box(swatch.surfaceAlt, "surfaceAlt")}
      {box(swatch.primary, "primary")}
      {box(swatch.accent, "accent")}
      {box(swatch.text, "text")}
    </div>
  );
}
