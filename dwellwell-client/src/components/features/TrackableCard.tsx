//dwellwell-client/src/components/features/TrackableCard.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import type { Task } from "@shared/types/task";
import TrackableTaskRow from "./TrackableTaskRow";
import { TRACKABLE_TYPE_ICONS, TRACKABLE_TYPE_IMAGES } from "@shared/icons/trackables";
import { getTypeLabel } from "@shared/constants/trackables";
import { ChevronDown, ChevronUp } from "lucide-react";

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

const STATUS_DOT: Record<"IN_USE" | "PAUSED" | "RETIRED", string> = {
  IN_USE: "bg-emerald-500",
  PAUSED: "bg-amber-500",
  RETIRED: "bg-slate-400",
};

const SAFE_COUNTS = { overdue: 0, dueSoon: 0, active: 0 };
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : undefined);

export default function TrackableCard({ data, onEdited, onRemoved, onOpenEdit }: Props) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  const counts = data?.counts ?? SAFE_COUNTS;
  const status = (data?.status ?? "IN_USE") as "IN_USE" | "PAUSED" | "RETIRED";
  const nextDue = data?.nextDueDate ?? null;

  const statusPill = useMemo(() => {
    switch (status) {
      case "IN_USE":
        return "bg-green-100 text-green-700";
      case "PAUSED":
        return "bg-amber-100 text-amber-700";
      case "RETIRED":
        return "bg-surface-alt text-gray-700";
      default:
        return "bg-surface-alt text-gray-700";
    }
  }, [status]);

  const hasFetchedRef = useRef(false);

  const normalizeTaskList = (raw: any): Task[] => {
    if (Array.isArray(raw)) return raw as Task[];
    if (Array.isArray(raw?.items)) return raw.items as Task[];
    if (Array.isArray(raw?.tasks)) return raw.tasks as Task[];
    return [];
  };

  const fetchTasks = useCallback(async () => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    setLoadingTasks(true);
    setError(null);
    try {
      const baseParams: Record<string, any> = {
        trackableId: data.id,
        includeCompleted: 0,
        includeArchived: 0,
        limit: 200,
      };

      let res = await api.get("/tasks", { params: baseParams });
      let list = normalizeTaskList(res.data);

      if ((!list || list.length === 0) && (data.counts?.active ?? 0) > 0) {
        const attempts = [
          { ...baseParams, status: "PENDING" },
          { ...baseParams, status: "OPEN" },
          { ...baseParams, state: "ACTIVE" },
          { ...baseParams, status: "active" },
        ];
        for (const p of attempts) {
          try {
            const r2 = await api.get("/tasks", { params: p });
            list = normalizeTaskList(r2.data);
            if (list.length) break;
          } catch { }
        }
      }

      setTasks(list);
    } catch (e) {
      console.error(e);
      setError("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [data.id, data.counts?.active]);

  const typeChip = useMemo(() => {
    if (!data.type) return null;
    const pretty = getTypeLabel(data.type) ?? data.type;

    const name = (data.userDefinedName || "").toLowerCase();
    const brand = (data.brand || "").toLowerCase();
    const model = (data.model || "").toLowerCase();
    const combined = `${data.brand || ""} ${data.model || ""}`.trim().toLowerCase();

    const likelyGeneric =
      (!!model && (name === model || name.includes(model))) ||
      (!!brand && !!model && name === combined) ||
      name.length <= 12; // short names like "Dishwasher", "TV", "Fridge"

    return likelyGeneric ? pretty : null;
  }, [data.userDefinedName, data.brand, data.model, data.type]);

  useEffect(() => {
    if (expanded && !hasFetchedRef.current) fetchTasks();
  }, [expanded, fetchTasks]);

  // One-time post-create hydration so counts/nextDue/image/type are correct without page refresh
  useEffect(() => {
    const needs = !data?.counts || typeof data?.nextDueDate === "undefined" || data?.nextDueDate === null;
    if (!needs) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get(`/trackables/${data.id}`);
        const d = r?.data ?? {};
        if (!cancelled) {
          onEdited?.({
            id: data.id,
            counts: d.counts ?? data.counts,
            nextDueDate: d.nextDueDate ?? data.nextDueDate,
            imageUrl: d.imageUrl ?? data.imageUrl,
            type: d.type ?? data.type,
            brand: d.brand ?? data.brand,
            model: d.model ?? data.model,
            status: d.status ?? data.status,
          });
        }
      } catch {
        // Ignore — card will still function; tasks load on expand.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  const pause = async () => {
    try {
      await api.post(`/trackables/${data.id}/pause`);
      onEdited?.({ id: data.id, status: "PAUSED" });
      toast({ title: "Paused", description: "Notifications paused." });
    } catch {
      toast({ title: "Could not pause", variant: "destructive" });
    }
  };
  const resume = async () => {
    try {
      await api.post(`/trackables/${data.id}/resume`, { mode: "forward" });
      onEdited?.({ id: data.id, status: "IN_USE" });
      toast({ title: "Resumed", description: "Scheduling resumed forward-only." });
    } catch {
      toast({ title: "Could not resume", variant: "destructive" });
    }
  };
  const retire = async () => {
    if (!confirm("Retire this item? Tasks will be archived (revivable later).")) return;
    try {
      await api.post(`/trackables/${data.id}/retire`, { reason: "BROKEN" });
      onEdited?.({ id: data.id, status: "RETIRED" });
      toast({ title: "Retired", description: "Item retired; tasks archived." });
    } catch {
      toast({ title: "Could not retire", variant: "destructive" });
    }
  };
  const revive = async () => {
    try {
      await api.post(`/trackables/${data.id}/revive`, { mode: "forward" });
      onEdited?.({ id: data.id, status: "IN_USE" });
      toast({ title: "Tracking again", description: "Tasks reactivated." });
    } catch {
      toast({ title: "Could not revive", variant: "destructive" });
    }
  };
  const remove = async () => {
    if (!confirm("Delete permanently? Consider retiring instead to keep history.")) return;
    try {
      await api.delete(`/trackables/${data.id}`);
      onRemoved?.(data.id);
      toast({ title: "Trackable deleted", variant: "destructive" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  // Icon + image fallbacks
  const icon = data.type ? TRACKABLE_TYPE_ICONS[data.type] : undefined;
  const placeholderSrc = (data.type && TRACKABLE_TYPE_IMAGES[data.type]) || undefined;
  const thumbSrc = data.imageUrl || placeholderSrc;

  // Keep “Active” count responsive to fetched tasks
  const liveCount = (data?.counts?.active ?? 0) || tasks.length;

  const prettyType = getTypeLabel(data.type) ?? (data.type || "—");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="self-start rounded-xl border border-token bg-card text-body p-4 shadow transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-start">
        <h3 className="text-lg font-semibold leading-tight pr-3 whitespace-normal break-words">
          {data.userDefinedName}
        </h3>
        <div className="ml-auto inline-flex items-center gap-2 text-xs">
          {typeChip && (
            <span className="px-2 py-0.5 rounded-full bg-surface-alt text-muted whitespace-nowrap">
              {typeChip}
            </span>
          )}
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
        </div>
      </div>

      {/* Counters row */}
      <div className="mt-2 flex items-center gap-4 text-muted">
        <span className="inline-flex items-center gap-1 text-sm">
          🕒 <span className="font-medium text-body">{counts.dueSoon}</span> Due Soon
        </span>
        <span className="inline-flex items-center gap-1 text-sm">
          ⚠️ <span className="font-medium text-body">{counts.overdue}</span> Overdue
        </span>
        <span className="inline-flex items-center gap-1 text-sm">
          📌 <span className="font-medium text-body">{liveCount}</span> Active
        </span>
      </div>

      {(data.lastCompletedAt || data.roomName) && (
        <p className="mt-1 text-sm text-muted">
          {data.lastCompletedAt ? `Last done: ${fmt(data.lastCompletedAt)}` : null}
          {data.lastCompletedAt && data.roomName ? " • " : ""}
          {data.roomName ? `Room: ${data.roomName}` : null}
        </p>
      )}

      <div className="h-[2px] bg-surface-alt rounded mt-3" />

      {/* Thumb + actions */}
      <div className="mt-3 flex items-center gap-3">
        <div
          className="shrink-0 w-16 h-16 rounded-xl bg-surface-alt flex items-center justify-center overflow-hidden border border-token"
          title={data.userDefinedName}
        >
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={data.userDefinedName}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-2xl">{icon ?? "🧰"}</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <button onClick={() => onOpenEdit?.(data.id)} className="hover:text-body">
              Edit
            </button>
            {status === "IN_USE" && (
              <button onClick={pause} className="hover:text-body">
                Pause
              </button>
            )}
            {status === "PAUSED" && (
              <button onClick={resume} className="hover:text-body">
                Resume
              </button>
            )}
            {status !== "RETIRED" ? (
              <button onClick={retire} className="hover:text-body">
                Retire
              </button>
            ) : (
              <button onClick={revive} className="hover:text-body">
                Revive
              </button>
            )}
            <button onClick={remove} className="hover:text-body">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Expand / Collapse Button */}
      <div className="mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-[rgb(var(--primary))] rounded-full
                     flex items-center gap-2 text-sm font-medium transition-colors"
          title={expanded ? "Hide Tasks" : "Show Tasks"}
        >
          {expanded ? "Hide Tasks" : `Show Tasks (${(data?.counts?.active ?? 0) || tasks.length})`}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
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
            <div className="mt-4 rounded-xl border border-token bg-surface-alt p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">
                  Tasks {loadingTasks ? "" : `(${tasks.length})`}
                </div>
              </div>

              {loadingTasks && (
                <div className="grid gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 w-full animate-pulse rounded bg-card border border-token" />
                  ))}
                </div>
              )}

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </div>
              )}

              {!loadingTasks && !error && tasks.length === 0 && (
                <div className="text-sm text-muted">No active tasks for this item.</div>
              )}

              <div className="divide-y divide-[rgb(var(--border)/1)]">
                {tasks.map((t) => (
                  <TrackableTaskRow
                    key={t.id}
                    task={t}
                    onChanged={() => {
                      hasFetchedRef.current = false;
                      fetchTasks();
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
