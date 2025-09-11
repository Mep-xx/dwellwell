// dwellwell-client/src/pages/Room.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ClipboardList, ListChecks } from "lucide-react";
import { useRoomAutosave } from "@/hooks/useRoomAutosave";
import clsx from "clsx";

import {
  FLOORING_TYPES,
  WALL_FINISHES,
  CEILING_TYPES,
  WINDOW_TYPES,
  CEILING_FIXTURES,
  sortByLabel,
} from "@shared/constants/roomOptions";
import { ROOM_TYPES } from "@shared/constants/roomTypes";

/* ============================== Types =============================== */

type RoomDetail = {
  // NOTE: prisma field is `flooring`, not `flooringType`
  flooring?: string | null;
  wallFinish?: string | null;
  ceilingType?: string | null;
  windowType?: string | null;
  ceilingFixture?: string | null;
};

type Room = {
  id: string;
  homeId: string;
  name?: string | null;
  type?: string | null;
  floor?: number | null;
  detail?: RoomDetail | null;
};

type Trackable = {
  id: string;
  name: string;
  type?: string | null;
  roomId?: string | null;
  schedule?: string | null;
};

type Task = {
  id: string;
  title: string;
  status?: "open" | "done" | string;
  dueDate?: string | null;
};

/* ============================== Page =============================== */

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const location = useLocation() as any;
  const routeId = params?.id ?? null;
  const pathId = useMemo(() => {
    const p = String(location?.pathname || window.location.pathname || "");
    const m = p.match(/\/rooms\/([^/?#]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }, [location?.pathname]);
  const roomId = routeId ?? pathId;

  const preloaded: Room | null = location?.state?.room ?? null;

  const { toast } = useToast();
  const navigate = useNavigate();
  const addRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(preloaded ?? null);
  const [trackables, setTrackables] = useState<Trackable[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // UI form (add trackable)
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");

  const { saving: autosaveStatus, scheduleSave } = useRoomAutosave(roomId || "");

  const goHome = () => {
    if (room?.homeId) navigate(`/app/homes/${room.homeId}?tab=rooms`);
    else navigate("/app/homes");
  };

  /* ------------------------------- Load ------------------------------- */

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setTrackables([]);
      setTasks([]);
      setLoadError("Missing room id.");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setLoadError(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    (async () => {
      try {
        if (preloaded && mounted) setRoom(preloaded);

        const { data } = await api.get(`/rooms/${roomId}`, {
          params: { includeDetails: true },
          signal: controller.signal as any,
        });
        if (mounted) setRoom(data);

        try {
          const { data: t } = await api.get(`/trackables`, { params: { roomId } });
          if (mounted) setTrackables(Array.isArray(t) ? t : []);
        } catch {}

        try {
          const { data: taskList } = await api.get(`/tasks`, { params: { roomId } });
          if (mounted) setTasks(Array.isArray(taskList) ? taskList : []);
        } catch {}
      } catch (e: any) {
        if (!mounted) return;
        setLoadError(e?.message?.includes("aborted") ? "Request timed out." : "Couldn’t load this room.");
      } finally {
        window.clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [roomId, preloaded]);

  useEffect(() => {
    if (window.location.hash === "#add-trackable") {
      setTimeout(() => addRef.current?.focus(), 0);
    }
  }, []);

  /* ----------------------------- Trackables ---------------------------- */

  const addTrackable = async () => {
    if (!room || !newName.trim()) return;
    try {
      const payload = { name: newName.trim(), type: newType || null, roomId: room.id };
      const { data } = await api.post(`/trackables`, payload);
      setTrackables((t) => [data, ...t]);
      setNewName("");
      setNewType("");
      toast({ title: "Added", description: "Trackable created." });
    } catch {
      toast({ title: "Add failed", description: "Couldn’t create trackable.", variant: "destructive" });
    }
  };

  const removeTrackable = async (id: string) => {
    const prev = trackables;
    setTrackables((t) => t.filter((x) => x.id !== id));
    try {
      await api.delete(`/trackables/${id}`);
    } catch {
      setTrackables(prev);
      toast({ title: "Delete failed", description: "Couldn’t delete trackable.", variant: "destructive" });
    }
  };

  /* ------------------------------ Details ----------------------------- */

  const details = room?.detail ?? {};
  function updateDetail<K extends keyof RoomDetail>(key: K, value: RoomDetail[K]) {
    if (!room) return;
    const val = (value === "" ? null : value) as RoomDetail[K];
    const nextDetail = { ...(room.detail ?? {}), [key]: val ?? null };
    setRoom({ ...room, detail: nextDetail });
    // send prisma field names (e.g., "flooring")
    scheduleSave({ details: { [key]: val ?? null } });
  }

  const sortedFlooring = useMemo(() => sortByLabel(FLOORING_TYPES), []);
  const sortedWalls = useMemo(() => sortByLabel(WALL_FINISHES), []);
  const sortedCeilings = useMemo(() => sortByLabel(CEILING_TYPES), []);
  const sortedWindows = useMemo(() => sortByLabel(WINDOW_TYPES), []);
  const sortedFixtures = useMemo(() => sortByLabel(CEILING_FIXTURES), []);

  /* ---------------------------- Autosave Chip -------------------------- */

  const autosaveChip = (
    <div
      className={clsx(
        "rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
        autosaveStatus === "saving" &&
          "bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-300/60 animate-pulse",
        autosaveStatus === "ok" &&
          "bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-300/50",
        autosaveStatus === "error" &&
          "bg-red-50 text-red-700 border-red-200 ring-2 ring-red-300/60",
        autosaveStatus === "idle" && "bg-transparent text-muted-foreground border-transparent"
      )}
      aria-live="polite"
    >
      {autosaveStatus === "saving"
        ? "Saving…"
        : autosaveStatus === "ok"
        ? "Saved"
        : autosaveStatus === "error"
        ? "Save failed"
        : " "}
    </div>
  );

  /* ------------------------------- UI -------------------------------- */

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading room…</div>
      </div>
    );
  }

  if (loadError || !room) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="mb-3 text-base font-semibold">We couldn’t open this room.</div>
        <div className="mb-6 text-sm text-muted-foreground">
          {loadError || "It may have been renamed or deleted, or you may not have access."}
        </div>
        <Button variant="outline" onClick={goHome}>Back to Home</Button>
      </div>
    );
  }

  const title = room.name?.trim() || room.type || "Room";

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div
        className={clsx(
          "mb-4 flex items-center justify-between rounded-md",
          (autosaveStatus === "saving" || autosaveStatus === "ok") && "ring-2 ring-emerald-300/50"
        )}
      >
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {autosaveChip}
          <Button variant="outline" onClick={goHome}>
            Back to Home
          </Button>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* MAIN: Trackables + Tasks */}
        <div className="md:col-span-2 space-y-6">
          {/* Trackables */}
          <section className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Trackables
              </h2>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                ref={addRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New trackable name (e.g., Air Filter)"
              />
              <Input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Type (optional)"
              />
              <Button onClick={addTrackable}>
                <Plus className="mr-1 h-4 w-4" />
                Add Trackable
              </Button>
            </div>

            {trackables.length === 0 ? (
              <div className="text-sm text-muted-foreground">No trackables yet.</div>
            ) : (
              <ul className="divide-y rounded border">
                {trackables.map((t) => (
                  <li key={t.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      {t.type ? <div className="text-xs text-muted-foreground">{t.type}</div> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => removeTrackable(t.id)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Tasks */}
          <section className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Tasks
              </h2>
            </div>

            {tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tasks yet.</div>
            ) : (
              <ul className="divide-y rounded border">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {task.status || "open"}
                        {task.dueDate ? ` · due ${new Date(task.dueDate).toLocaleDateString()}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Open</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* SIDEBAR: Details */}
        <div className="space-y-6">
          {/* Basics */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-base font-semibold">Basics</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input
                  value={room.name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoom({ ...room, name: val });
                    scheduleSave({ name: val });
                  }}
                  placeholder="e.g., Playroom"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={room.type || ""}
                  onChange={(e) => {
                    const val = e.target.value; // send empty string if cleared
                    setRoom({ ...room, type: val || null });
                    scheduleSave({ type: val });
                  }}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">(Select type)</option>
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Floor</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={room.floor ?? ""}
                  onChange={(e) => {
                    const num = e.target.value ? Number(e.target.value) : null;
                    setRoom({ ...room, floor: num });
                    scheduleSave({ floor: num });
                  }}
                  placeholder="1"
                />
              </div>
            </div>
          </section>

          {/* Surfaces */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-base font-semibold">Surfaces</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Flooring</label>
                <select
                  value={details.flooring || ""}
                  onChange={(e) => updateDetail("flooring", e.target.value || null)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">(Select…)</option>
                  {sortedFlooring.map((o) => (
                    <option key={o.value} value={o.value}>{o.label} {o.icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Walls</label>
                <select
                  value={details.wallFinish || ""}
                  onChange={(e) => updateDetail("wallFinish", e.target.value || null)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">(Select…)</option>
                  {sortedWalls.map((o) => (
                    <option key={o.value} value={o.value}>{o.label} {o.icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Ceiling</label>
                <select
                  value={details.ceilingType || ""}
                  onChange={(e) => updateDetail("ceilingType", e.target.value || null)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">(Select…)</option>
                  {sortedCeilings.map((o) => (
                    <option key={o.value} value={o.value}>{o.label} {o.icon}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Openings */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-base font-semibold">Openings</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Windows</label>
                <select
                  value={details.windowType || ""}
                  onChange={(e) => updateDetail("windowType", e.target.value || null)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">(Select…)</option>
                  {sortedWindows.map((o) => (
                    <option key={o.value} value={o.value}>{o.label} {o.icon}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Lighting */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-base font-semibold">Lighting</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Ceiling Fixture</label>
                <select
                  value={details.ceilingFixture || ""}
                  onChange={(e) => updateDetail("ceilingFixture", e.target.value || null)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">(Select…)</option>
                  {sortedFixtures.map((o) => (
                    <option key={o.value} value={o.value}>{o.label} {o.icon}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
