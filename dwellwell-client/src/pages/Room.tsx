// dwellwell-client/src/pages/Room.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useRoomAutosave } from "@/hooks/useRoomAutosave";
import { getRoomVisual } from "@/utils/roomVisuals";
import { floorOptionsWithOther as FLOOR_OPTIONS, floorLabel } from "@shared/constants/floors";
import TrackableModal from "@/components/features/TrackableModal";

import {
  FLOORING_TYPES,
  WALL_FINISHES,
  CEILING_TYPES,
  WINDOW_TYPES,
  CEILING_FIXTURES,
  sortByLabel,
} from "@shared/constants/roomOptions";

/* ============================== Types =============================== */
type Room = {
  id: string;
  homeId: string;
  name?: string | null;
  type?: string | null;
  floor?: number | null;
  detail?: RoomDetail | null;
};

type RoomDetail = {
  flooring?: string | null;
  wallFinish?: string | null;
  ceilingType?: string | null;

  windowType?: string | null;
  windowCount?: number | null;
  hasExteriorDoor?: boolean | null;

  heatBaseboardHydronic?: boolean | null;
  heatBaseboardElectric?: boolean | null;
  heatRadiator?: boolean | null;
  hvacSupplyVents?: number | null;
  hvacReturnVents?: number | null;

  hasCeilingFan?: boolean | null;
  ceilingFixture?: string | null;
  recessedLightCount?: number | null;

  approxOutletCount?: number | null;
  hasGfci?: boolean | null;

  hasSmokeDetector?: boolean | null;
  hasCoDetector?: boolean | null;
  hasFireplace?: boolean | null;

  sinkCount?: number | null;
  toiletCount?: number | null;
  showerCount?: number | null;
  tubCount?: number | null;
  hasRadiantFloorHeat?: boolean | null;

  hasAtticAccess?: boolean | null;
  hasCrawlspaceAccess?: boolean | null;
  attributes?: Record<string, any> | null;
};

type Trackable = {
  id: string;
  name?: string;
  type?: string | null;
  kind?: string | null;
  userDefinedName?: string | null;
  roomId?: string | null;
  homeId?: string;
};

type UserTask = {
  id: string;
  title: string;
  dueDate?: string | null;
  completedAt?: string | null;
  priority?: string | null;
};

/* ============================== Helpers =============================== */

function num(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ============================== Page =============================== */

export default function RoomPage() {
  const params = useParams<{ id?: string; roomId?: string }>();
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { toast } = useToast();

  const rawFromUrl = useMemo(() => {
    const m = window.location.pathname.match(/\/rooms\/([^\/?#]+)/i);
    return m?.[1];
  }, [location.pathname]);

  const preloaded: Room | null = location?.state?.room ?? null;
  const roomId: string | undefined = params.roomId ?? params.id ?? preloaded?.id ?? rawFromUrl;

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(preloaded ?? null);
  const [roomTasks, setRoomTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [trackables, setTrackables] = useState<Trackable[]>([]);
  const [trackableOpen, setTrackableOpen] = useState(false);

  const addRef = useRef<HTMLInputElement | null>(null);

  /* ------------------------------- Autosave ------------------------------- */
  const { saving: autosaveStatus, savedPulse, scheduleSave, flushNow } = useRoomAutosave(roomId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flushNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flushNow]);

  /* ------------------------------- Load ------------------------------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!roomId) { setRoomTasks([]); setTasksLoading(false); return; }
      setTasksLoading(true);
      try {
        const { data } = await api.get(`/rooms/${roomId}/tasks`);
        if (!cancelled) setRoomTasks(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRoomTasks([]);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;

    async function ensureDetailExists(id: string) {
      // If there is no RoomDetail row yet, create one so Prisma defaults apply.
      if (!room?.detail) {
        try {
          const { data: updated } = await api.put(`/rooms/${id}`, { details: {} });
          if (!cancelled) setRoom(updated);
        } catch (e) {
          // Non-fatal; leave as-is
        }
      }
    }

    async function load() {
      if (!roomId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let base: Room | null = preloaded;
        if (!base) {
          try {
            const { data } = await api.get(`/rooms/${roomId}`, { params: { includeDetails: true } });
            base = data ?? null;
            if (!cancelled) setRoom(base);
          } catch (err: any) {
            if (!cancelled) {
              toast({
                title: "We couldn’t open this room.",
                description: "Missing room or you don’t have access.",
                variant: "destructive",
              });
              setRoom(null);
            }
            return;
          }
        }

        if (base?.id) {
          await ensureDetailExists(base.id);

          try {
            const { data: t } = await api.get(`/trackables`, { params: { roomId: base.id } });
            if (!cancelled) setTrackables(Array.isArray(t) ? t : []);
          } catch {
            /* ignore */
          }
          // tasks list is loaded by the dedicated effect above
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [roomId, preloaded, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open the add-trackable modal if the URL hash is present
  useEffect(() => {
    if (window.location.hash === "#add-trackable") {
      setTrackableOpen(true);
    }
  }, [location.hash]);

  const visual = useMemo(() => getRoomVisual(room?.type), [room?.type]);

  /* ------------------------------- UI -------------------------------- */

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading room…</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="rounded-lg border p-4">
          <h1 className="text-xl font-semibold mb-1">We couldn’t open this room.</h1>
          <p className="text-sm text-muted-foreground">
            {roomId ? "It may not exist or you don’t have access." : "Missing room id in the URL."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => navigate("/app/homes")}>Back to Homes</Button>
          </div>
        </div>
      </div>
    );
  }

  const d: RoomDetail = room!.detail ?? {};
  const savingBadge =
    autosaveStatus === "saving" ? "Saving…" :
      autosaveStatus === "error" ? "⚠ Save failed" :
        autosaveStatus === "ok" ? "✓ Saved" : "";

  function updateDetails(patch: Partial<RoomDetail>) {
    const merged = { ...(room!.detail ?? {}), ...patch };
    setRoom((prev) => (prev ? { ...prev, detail: merged } : prev));
    scheduleSave({ details: patch });
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* ---------- HERO ---------- */}
      <div
        className={[
          "relative mb-4 overflow-hidden rounded-xl border",
          savedPulse ? "ring-2 ring-emerald-400/60 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" : "",
        ].join(" ")}
      >
        <picture>
          <source
            type="image/webp"
            srcSet={[
              `${(visual.image1x ?? "/images/room-fallback.jpg").replace(".jpg", ".webp")} 1x`,
              visual.image2x ? `${visual.image2x.replace(".jpg", ".webp")} 2x` : undefined,
            ].filter(Boolean).join(", ")}
            sizes="100vw"
          />
          <img
            src={visual.image1x ?? "/images/room-fallback.jpg"}
            srcSet={visual.image2x ? `${visual.image2x} 2x` : undefined}
            alt={`${visual.label} photo`}
            className="h-48 w-full object-cover md:h-64"
            loading="eager"
            fetchPriority="high"
          />
        </picture>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,.38), rgba(0,0,0,.08) 40%, transparent),
       linear-gradient(to right, ${visual.accent}22, ${visual.accent}00 55%)`,
          }}
        />

        <div className="absolute bottom-3 left-4 flex items-start gap-3">
          <visual.Icon className="h-8 w-8 text-white/80 drop-shadow-sm" />
          <div>
            <h1 className="text-2xl font-bold leading-tight text-white drop-shadow-sm">
              {room.name?.trim() || room.type || "Room"}
            </h1>
            <div className="text-xs text-white/85 drop-shadow-sm">
              {(room.type || visual.label) + " · " + floorLabel(room.floor)}
            </div>
            <div className="mt-1 h-1.5 w-24 rounded-full" style={{ backgroundColor: visual.accent }} />
          </div>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          {savingBadge ? (
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur"
              style={{
                color: "white",
                background:
                  autosaveStatus === "error" ? "rgba(244,63,94,.55)"
                    : autosaveStatus === "saving" ? "rgba(245,158,11,.55)"
                      : "rgba(16,185,129,.55)",
                borderColor: "rgba(255,255,255,.25)",
              }}
            >
              {savingBadge}
            </span>
          ) : null}

          <Button
            variant="secondary"
            className="bg-white/80 text-slate-900 hover:bg-white border"
            onClick={() => navigate(`/app/homes/${room.homeId}?tab=rooms`)}
          >
            Back to Rooms
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left — Trackables & Tasks */}
        <div className="md:col-span-2 space-y-4">
          {/* Trackables */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="font-semibold">Trackables</div>
              <Button onClick={() => setTrackableOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Trackable
              </Button>
            </div>

            <div className="p-4">
              {trackables.length === 0 ? (
                <div className="text-sm text-muted-foreground">No trackables yet.</div>
              ) : (
                <ul className="divide-y rounded border">
                  {trackables.map((t) => {
                    const display = t.userDefinedName || t.name || "(Unnamed)";
                    const subtype = t.kind || t.type || "";
                    return (
                      <li key={t.id} className="flex items-center justify-between p-3">
                        <div>
                          <div className="font-medium">{display}</div>
                          {subtype ? <div className="text-xs text-muted-foreground">{subtype}</div> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const prev = trackables;
                              setTrackables((p) => p.filter((x) => x.id !== t.id));
                              try { await api.delete(`/trackables/${t.id}`); }
                              catch {
                                setTrackables(prev);
                                toast({ title: "Delete failed", description: "Couldn’t delete trackable.", variant: "destructive" });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-lg border">
            <div className="px-4 py-2 border-b font-semibold flex items-center justify-between">
              <span>Tasks</span>
              <span className="text-xs text-muted-foreground">
                {tasksLoading ? "Loading…" : `${roomTasks.length} total`}
              </span>
            </div>

            <div className="p-4">
              {tasksLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : roomTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks yet for this room.</div>
              ) : (
                <ul className="space-y-2">
                  {roomTasks.slice(0, 10).map((t) => {
                    const overdue = t.status === "PENDING" && t.dueDate && new Date(t.dueDate) < new Date();
                    const soon = t.status === "PENDING" && t.dueDate && !overdue &&
                      (new Date(t.dueDate).getTime() - Date.now()) <= 7 * 24 * 60 * 60 * 1000;
                    return (
                      <li key={t.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm">{t.title || "Task"}</div>
                          <div className="text-xs text-muted-foreground">
                            {(t.category || t.taskType || "General")}
                            {t.dueDate ? ` • due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {overdue && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-700 border border-red-200">Overdue</span>}
                          {!overdue && soon && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700 border border-amber-200">Due soon</span>}
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/app/tasks?taskId=${encodeURIComponent(t.id)}`)}>Open</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right — Details */}
        <div className="space-y-4">
          {/* Basics */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Basics</div>

            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input
              value={room.name || ""}
              onChange={(e) => {
                const val = e.target.value;
                setRoom({ ...room, name: val });
                scheduleSave({ name: val });
              }}
              onBlur={() => void flushNow()}
              placeholder="e.g., Primary Bathroom"
              className="mb-3"
            />

            {/* Type is read-only here */}
            <label className="mb-1 block text-sm font-medium">Type</label>
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                <visual.Icon className="h-4 w-4" />
                {getRoomVisual(room.type).label}
              </span>
              <div className="mt-1 text-xs text-muted-foreground">
                Room type is managed on the{" "}
                <button className="underline" onClick={() => navigate(`/app/homes/${room.homeId}?tab=rooms`)}>
                  Rooms page
                </button>
                .
              </div>
            </div>

            <label className="mb-1 block text-sm font-medium">Floor</label>
            <select
              value={room.floor === null || room.floor === undefined ? "" : String(room.floor)}
              onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                setRoom({ ...room, floor: v });
                scheduleSave({ floor: v });
              }}
              onBlur={() => void flushNow()}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {FLOOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Surfaces */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Surfaces</div>

            <label className="mb-1 block text-sm font-medium">Flooring</label>
            <select
              value={d.flooring ?? ""}
              onChange={(e) => updateDetails({ flooring: e.target.value || null })}
              onBlur={() => void flushNow()}
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {sortByLabel(FLOORING_TYPES).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium">Wall finish</label>
            <select
              value={d.wallFinish ?? ""}
              onChange={(e) => updateDetails({ wallFinish: e.target.value || null })}
              onBlur={() => void flushNow()}
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {sortByLabel(WALL_FINISHES).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium">Ceiling type</label>
            <select
              value={d.ceilingType ?? ""}
              onChange={(e) => updateDetails({ ceilingType: e.target.value || null })}
              onBlur={() => void flushNow()}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {sortByLabel(CEILING_TYPES).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Openings */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Openings</div>

            <label className="mb-1 block text-sm font-medium">Window type</label>
            <select
              value={d.windowType ?? ""}
              onChange={(e) => updateDetails({ windowType: e.target.value || null })}
              onBlur={() => void flushNow()}
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {sortByLabel(WINDOW_TYPES).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium">Window count</label>
            <Input
              type="number"
              min={0}
              value={d.windowCount ?? 0}
              onChange={(e) => updateDetails({ windowCount: num(e.target.value) })}
              onBlur={() => void flushNow()}
              className="mb-3"
            />

            <div className="flex items-center justify-between">
              <label className="text-sm">Exterior door present</label>
              <Switch
                checked={!!d.hasExteriorDoor}
                onCheckedChange={(v) => updateDetails({ hasExteriorDoor: v })}
                onBlur={() => void flushNow()}
              />
            </div>
          </div>

          {/* HVAC & Lighting */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">HVAC & Lighting</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Supply vents</label>
                <Input
                  type="number"
                  min={0}
                  value={d.hvacSupplyVents ?? 0}
                  onChange={(e) => updateDetails({ hvacSupplyVents: num(e.target.value) })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Return vents</label>
                <Input
                  type="number"
                  min={0}
                  value={d.hvacReturnVents ?? 0}
                  onChange={(e) => updateDetails({ hvacReturnVents: num(e.target.value) })}
                  onBlur={() => void flushNow()}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Baseboard (hydronic)</span>
                <Switch
                  checked={!!d.heatBaseboardHydronic}
                  onCheckedChange={(v) => updateDetails({ heatBaseboardHydronic: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Baseboard (electric)</span>
                <Switch
                  checked={!!d.heatBaseboardElectric}
                  onCheckedChange={(v) => updateDetails({ heatBaseboardElectric: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Radiator heat</span>
                <Switch
                  checked={!!d.heatRadiator}
                  onCheckedChange={(v) => updateDetails({ heatRadiator: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ceiling fan</span>
                <Switch
                  checked={!!d.hasCeilingFan}
                  onCheckedChange={(v) => updateDetails({ hasCeilingFan: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
            </div>

            <label className="mt-3 mb-1 block text-sm font-medium">Ceiling fixture</label>
            <select
              value={d.ceilingFixture ?? ""}
              onChange={(e) => updateDetails({ ceilingFixture: e.target.value || null })}
              onBlur={() => void flushNow()}
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {CEILING_FIXTURES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium">Recessed lights</label>
            <Input
              type="number"
              min={0}
              value={d.recessedLightCount ?? 0}
              onChange={(e) => updateDetails({ recessedLightCount: num(e.target.value) })}
              onBlur={() => void flushNow()}
            />
          </div>

          {/* Electrical */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Electrical</div>

            <label className="mb-1 block text-sm font-medium">Approx. outlet count</label>
            <Input
              type="number"
              min={0}
              value={d.approxOutletCount ?? 0}
              onChange={(e) => updateDetails({ approxOutletCount: num(e.target.value) })}
              onBlur={() => void flushNow()}
              className="mb-3"
            />

            <div className="flex items-center justify-between">
              <span className="text-sm">GFCI present</span>
              <Switch
                checked={!!d.hasGfci}
                onCheckedChange={(v) => updateDetails({ hasGfci: v })}
                onBlur={() => void flushNow()}
              />
            </div>
          </div>

          {/* Safety */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Safety</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Smoke detector</span>
                <Switch
                  checked={!!d.hasSmokeDetector}
                  onCheckedChange={(v) => updateDetails({ hasSmokeDetector: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CO detector</span>
                <Switch
                  checked={!!d.hasCoDetector}
                  onCheckedChange={(v) => updateDetails({ hasCoDetector: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fireplace</span>
                <Switch
                  checked={!!d.hasFireplace}
                  onCheckedChange={(v) => updateDetails({ hasFireplace: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
            </div>
          </div>

          {/* Plumbing */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Plumbing</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Sinks</label>
                <Input
                  type="number"
                  min={0}
                  value={d.sinkCount ?? 0}
                  onChange={(e) => updateDetails({ sinkCount: num(e.target.value) })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Toilets</label>
                <Input
                  type="number"
                  min={0}
                  value={d.toiletCount ?? 0}
                  onChange={(e) => updateDetails({ toiletCount: num(e.target.value) })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Showers</label>
                <Input
                  type="number"
                  min={0}
                  value={d.showerCount ?? 0}
                  onChange={(e) => updateDetails({ showerCount: num(e.target.value) })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tubs</label>
                <Input
                  type="number"
                  min={0}
                  value={d.tubCount ?? 0}
                  onChange={(e) => updateDetails({ tubCount: num(e.target.value) })}
                  onBlur={() => void flushNow()}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm">Radiant floor heat</span>
              <Switch
                checked={!!d.hasRadiantFloorHeat}
                onCheckedChange={(v) => updateDetails({ hasRadiantFloorHeat: v })}
                onBlur={() => void flushNow()}
              />
            </div>
          </div>

          {/* Access / Misc */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Access & Misc</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Attic access</span>
                <Switch
                  checked={!!d.hasAtticAccess}
                  onCheckedChange={(v) => updateDetails({ hasAtticAccess: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Crawlspace access</span>
                <Switch
                  checked={!!d.hasCrawlspaceAccess}
                  onCheckedChange={(v) => updateDetails({ hasCrawlspaceAccess: v })}
                  onBlur={() => void flushNow()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trackable modal */}
      <TrackableModal
        isOpen={trackableOpen}
        onClose={() => setTrackableOpen(false)}
        onSave={(saved) => {
          setTrackables((t) => [
            {
              id: crypto.randomUUID(),
              userDefinedName: saved.userDefinedName,
              kind: saved.type ?? null,
              type: saved.type ?? null,
              roomId: room.id,
              homeId: room.homeId,
            } as any,
            ...t,
          ]);
        }}
        initialData={{ homeId: room.homeId, roomId: room.id, userDefinedName: "" } as any}
      />
    </div>
  );
}
