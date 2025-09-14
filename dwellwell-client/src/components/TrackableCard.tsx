import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import type { Task } from "@shared/types/task";
import TrackableTaskRow from "./TrackableTaskRow";
import { TRACKABLE_TYPE_ICONS } from "@shared/icons/trackables";

/** Summary shape returned by /trackables (with rollups). */
export type TrackableSummary = {
  id: string;
  userDefinedName: string;
  imageUrl?: string | null;
  type?: string | null;
  brand?: string | null;
  model?: string | null;
  category?: string | null;

  status: "IN_USE" | "PAUSED" | "RETIRED";
  pausedAt?: string | null;
  retiredAt?: string | null;

  nextDueDate?: string | null;
  counts?: { overdue: number; dueSoon: number; active: number };

  roomName?: string | null;
  homeName?: string | null;
  lastCompletedAt?: string | null;
};

type Props = {
  data: TrackableSummary;
  onEdited?: (patch: Partial<TrackableSummary> & { id: string }) => void;
  onRemoved?: (id: string) => void;
  onOpenEdit?: (trackableId: string) => void;
};

// Friendly labels for enum-y statuses
const STATUS_LABELS: Record<"IN_USE" | "PAUSED" | "RETIRED", string> = {
  IN_USE: "In Use",
  PAUSED: "Paused",
  RETIRED: "Retired",
};

const SAFE_COUNTS = { overdue: 0, dueSoon: 0, active: 0 };

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : undefined;

export default function TrackableCard({ data, onEdited, onRemoved, onOpenEdit }: Props) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Defensive shims
  const counts = data?.counts ?? SAFE_COUNTS;
  const status = (data?.status ?? "IN_USE") as "IN_USE" | "PAUSED" | "RETIRED";
  const nextDue = data?.nextDueDate ?? null;

  const statusPill = useMemo(() => {
    switch (status) {
      case "IN_USE": return "bg-green-100 text-green-700";
      case "PAUSED": return "bg-amber-100 text-amber-700";
      case "RETIRED": return "bg-gray-200 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  }, [status]);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    setError(null);
    try {
      const res = await api.get("/tasks", { params: { trackableId: data.id, status: "active" } });
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [data.id]);

  useEffect(() => {
    if (expanded && tasks.length === 0 && !loadingTasks && !error) fetchTasks();
  }, [expanded, tasks.length, loadingTasks, error, fetchTasks]);

  // Lifecycle
  const pause = async () => {
    try { await api.post(`/trackables/${data.id}/pause`); onEdited?.({ id: data.id, status: "PAUSED" }); toast({ title: "Paused", description: "Notifications paused." }); }
    catch { toast({ title: "Could not pause", variant: "destructive" }); }
  };
  const resume = async () => {
    try { await api.post(`/trackables/${data.id}/resume`, { mode: "forward" }); onEdited?.({ id: data.id, status: "IN_USE" }); toast({ title: "Resumed", description: "Scheduling resumed forward-only." }); }
    catch { toast({ title: "Could not resume", variant: "destructive" }); }
  };
  const retire = async () => {
    if (!confirm("Retire this item? Tasks will be archived (revivable later).")) return;
    try { await api.post(`/trackables/${data.id}/retire`, { reason: "BROKEN" }); onEdited?.({ id: data.id, status: "RETIRED" }); toast({ title: "Retired", description: "Item retired; tasks archived." }); }
    catch { toast({ title: "Could not retire", variant: "destructive" }); }
  };
  const revive = async () => {
    try { await api.post(`/trackables/${data.id}/revive`, { mode: "forward" }); onEdited?.({ id: data.id, status: "IN_USE" }); toast({ title: "Tracking again", description: "Tasks reactivated." }); }
    catch { toast({ title: "Could not revive", variant: "destructive" }); }
  };
  const remove = async () => {
    if (!confirm("Delete permanently? Consider retiring instead to keep history.")) return;
    try { await api.delete(`/trackables/${data.id}`); onRemoved?.(data.id); toast({ title: "Trackable deleted", variant: "destructive" }); }
    catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const icon = data.type ? TRACKABLE_TYPE_ICONS[data.type] : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-xl border shadow bg-white p-4 transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Header: Title left, status & next-due right */}
      <div className="flex items-start">
        <h3 className="text-lg font-semibold text-gray-800 leading-tight truncate pr-3">
          {data.userDefinedName}
        </h3>
        <div className="ml-auto flex items-center gap-2">
          {nextDue ? (
            <span className="text-xs px-2 py-0.5 rounded border border-blue-200 text-blue-700 bg-blue-50/50">
              Next due: {fmt(nextDue)}
            </span>
          ) : null}
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusPill}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* Counters row */}
      <div className="mt-2 flex items-center gap-4 text-gray-700">
        <span className="inline-flex items-center gap-1 text-sm">
          🕒 <span className="font-medium">{counts.dueSoon}</span> Due Soon
        </span>
        <span className="inline-flex items-center gap-1 text-sm">
          ⚠️ <span className="font-medium">{counts.overdue}</span> Overdue
        </span>
        <span className="inline-flex items-center gap-1 text-sm">
          📌 <span className="font-medium">{counts.active}</span> Active
        </span>
      </div>

      {(data.lastCompletedAt || data.roomName) && (
        <p className="mt-1 text-sm text-gray-600">
          {data.lastCompletedAt ? `Last done: ${fmt(data.lastCompletedAt)}` : null}
          {data.lastCompletedAt && data.roomName ? " • " : ""}
          {data.roomName ? `Room: ${data.roomName}` : null}
        </p>
      )}

      <div className="h-[2px] bg-gray-200 rounded mt-3" />

      {/* Thumb + actions */}
      <div className="mt-3 flex items-center gap-3">
        <button
          className="shrink-0 w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border"
          onClick={() => setExpanded(x => !x)}
          aria-label="Toggle tasks"
          title="Show tasks"
        >
          {data.imageUrl
            ? <img src={data.imageUrl} alt={data.userDefinedName} className="w-full h-full object-contain" />
            : <span className="text-2xl">{icon ?? "🧰"}</span>}
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
            <button onClick={() => onOpenEdit?.(data.id)} className="hover:text-black">Edit</button>
            {status === "IN_USE" && <button onClick={pause} className="hover:text-black">Pause</button>}
            {status === "PAUSED" && <button onClick={resume} className="hover:text-black">Resume</button>}
            {status !== "RETIRED"
              ? <button onClick={retire} className="hover:text-black">Retire</button>
              : <button onClick={revive} className="hover:text-black">Revive</button>}
            <button onClick={remove} className="hover:text-black">Delete</button>
          </div>

          <p className="mt-1 text-sm text-gray-600 truncate">
            {(data.type || "—")} • {data.brand || ""} {data.model || ""}
          </p>
        </div>
      </div>

      {/* Expandable tasks */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl border bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">Tasks ({tasks.length || counts.active})</div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-gray-700 hover:text-black underline"
                    onClick={(e) => { e.stopPropagation(); fetchTasks(); }}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loadingTasks && (
                <div className="grid gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-200" />
                  ))}
                </div>
              )}

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </div>
              )}

              {!loadingTasks && !error && tasks.length === 0 && (
                <div className="text-sm text-gray-600">No active tasks for this item.</div>
              )}

              <div className="divide-y">
                {tasks.map((t) => (
                  <TrackableTaskRow key={t.id} task={t} onChanged={fetchTasks} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
