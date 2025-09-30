// dwellwell-client/src/pages/Home.tsx
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type { Room } from "@shared/types/room";
import type { Task } from "@shared/types/task";
import { api } from "@/utils/api";
import { resolveHomeImageUrl } from "@/utils/images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Pencil, Trash2, MapPin, AlertCircle, Clock, Target, ListChecks,
  CheckCircle2
} from "lucide-react";
import HomePhotoDropzone from "@/components/ui/HomePhotoDropzone";
import { useToast } from "@/components/ui/use-toast";
import { buildZillowUrl } from "@/utils/zillowUrl";
import HomeMetaCard from "@/components/redesign/HomeMetaCard";
import type { HomeWithMeta } from "@/types/extended";
import RoomsPanel from "@/components/redesign/RoomsPanel";
import TrackableModal from "@/components/features/TrackableModal"; // NEW
import QuickPromptsBar from "@/components/features/QuickPromptsBar"; // NEW

/* ====================== Types ====================== */
type Summary = {
  id: string;
  nickname: string | null;
  address: string; city: string; state: string; zip: string;
  squareFeet: number | null; yearBuilt: number | null;
  hasCentralAir: boolean; hasBaseboard: boolean;
  features: string[];
  counts: { rooms: number; vehicles: number; trackables: number };
};

type RecentItem = { id: string; title: string; when?: string; status?: string };

/* ====================== Helpers ====================== */
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function isOverdue(t: Task) { if (t.status !== "PENDING" || !t.dueDate) return false; return new Date(t.dueDate).getTime() < Date.now(); }
function isDueSoon(t: Task) {
  if (t.status !== "PENDING" || !t.dueDate) return false;
  const due = new Date(t.dueDate).getTime(); const now = Date.now(); const seven = 7 * 24 * 60 * 60 * 1000;
  return due >= now && due <= now + seven;
}
function maintenanceScore(overdue: number, soon: number) { return clamp(100 - overdue * 60 - soon * 20, 0, 100); }

type TabKey = "overview" | "details" | "rooms" | "features" | "services" | "docs";

/* ====================== Page ====================== */
export default function HomePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ---- state hooks (ALWAYS run)
  const [home, setHome] = useState<(HomeWithMeta & { rooms?: Room[] }) | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [homeTasks, setHomeTasks] = useState<Task[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [recent, setRecent] = useState<RecentItem[]>([]);
  const metaRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const [tab, setTab] = useState<TabKey>("overview");

  // Add Trackable modal controls (prefill room)
  const [trackableOpen, setTrackableOpen] = useState(false);
  const [prefillRoomId, setPrefillRoomId] = useState<string | undefined>(undefined);

  // NEW: Lite trackables list for QuickPromptsBar (id, roomId, kind)
  const [trackablesLite, setTrackablesLite] = useState<Array<{ id: string; roomId?: string | null; kind?: string | null }>>([]);

  // ---- effects (ALWAYS run)
  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [h, s] = await Promise.all([
          api.get<HomeWithMeta & { rooms?: Room[] }>(`/homes/${encodeURIComponent(id)}`),
          api.get<Summary>(`/homes/${encodeURIComponent(id)}/summary`).catch(() => ({ data: null as any })),
        ]);
        if (cancelled) return;
        setHome(h.data);
        if (s?.data) setSummary(s.data);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qs = (params.get("tab") || "").toLowerCase();
    if (["overview", "details", "rooms", "features", "services", "docs"].includes(qs)) {
      setTab(qs as TabKey);
    } else {
      // keep existing tab if invalid / missing
    }
  }, [location.search]);

  const setTabAndUrl = (next: TabKey) => {
    const params = new URLSearchParams(location.search);
    params.set("tab", next);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: false });
    setTab(next);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setTasksLoading(true); setTaskError(null);
      try {
        const res = await api.get("/tasks", { params: { homeId: id, status: "active", limit: 50 } });
        if (cancelled) return;
        const list: Task[] = Array.isArray(res.data) ? res.data : [];
        setActiveTasks(list);

        let pool = list;
        if (pool.length === 0) {
          try {
            const up = await api.get("/tasks", { params: { homeId: id, limit: 10, sort: "dueDate" } });
            pool = Array.isArray(up.data) ? up.data : [];
          } catch { /* ignore */ }
        }

        const ranked = [...pool].sort((a, b) => {
          const aRank = isOverdue(a) ? 2 : isDueSoon(a) ? 1 : 0;
          const bRank = isOverdue(b) ? 2 : isDueSoon(b) ? 1 : 0;
          if (aRank !== bRank) return bRank - aRank;
          const ad = new Date(a.dueDate || 0).getTime();
          const bd = new Date(b.dueDate || 0).getTime();
          return ad - bd;
        });

        setHomeTasks(ranked.slice(0, 7));
      } catch {
        if (!cancelled) {
          setTaskError("Could not load tasks");
          setActiveTasks([]);
          setHomeTasks([]);
        }
      } finally { if (!cancelled) setTasksLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const res = await api.get("/tasks", { params: { homeId: id, status: "completed", limit: 5, sort: "-completedAt" } });
        if (cancelled) return;
        const list: any[] = Array.isArray(res.data) ? res.data : [];
        setRecent(list.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title || "Completed task",
          when: t.completedAt || t.doneAt || t.updatedAt || null,
          status: "Completed"
        })));
      } catch { setRecent([]); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // NEW: load & refetch lite trackables for QuickPromptsBar
  useEffect(() => {
    let cancelled = false;
    async function loadTrackablesLite() {
      if (!id) return;
      try {
        const res = await api.get("/trackables", { params: { homeId: id, limit: 500 } });
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setTrackablesLite(list.map((t: any) => ({ id: t.id, roomId: t.roomId ?? null, kind: t.kind ?? null })));
      } catch {
        if (!cancelled) setTrackablesLite([]);
      }
    }
    loadTrackablesLite();
    return () => { cancelled = true; };
  }, [id]);

  const refetchTrackablesLite = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get("/trackables", { params: { homeId: id, limit: 500 } });
      const list = Array.isArray(res.data) ? res.data : [];
      setTrackablesLite(list.map((t: any) => ({ id: t.id, roomId: t.roomId ?? null, kind: t.kind ?? null })));
    } catch { /* ignore */ }
  }, [id]);

  // ---- memoized derived data (ALWAYS run; never after a conditional return)
  const img = useMemo(() => resolveHomeImageUrl(home?.imageUrl), [home?.imageUrl]);

  // NEW: enable Zillow button based on having enough address parts
  const hasAddress = useMemo(() => !!(home?.address && home?.city && home?.state && home?.zip), [home]);

  const zillowUrl = useMemo(() => {
    if (!hasAddress || !home) return null;
    return buildZillowUrl({
      address: home.address,
      apartment: (home as any).apartment ?? null,
      city: home.city,
      state: home.state,
      zip: home.zip,
    });
  }, [hasAddress, home]);

  const overdueCount = useMemo(() => activeTasks.filter(isOverdue).length, [activeTasks]);
  const dueSoonCount = useMemo(() => activeTasks.filter(isDueSoon).length, [activeTasks]);
  const score = useMemo(() => maintenanceScore(overdueCount, dueSoonCount), [overdueCount, dueSoonCount]);

  const tasksByRoom = useMemo(() => {
    const by: Record<string, { overdue: number; soon: number }> = {};
    for (const t of activeTasks) {
      const rid = (t as any).roomId as string | undefined;
      if (!rid) continue;
      if (!by[rid]) by[rid] = { overdue: 0, soon: 0 };
      if (isOverdue(t)) by[rid].overdue++; else if (isDueSoon(t)) by[rid].soon++;
    }
    return by;
  }, [activeTasks]);

  // ---- actions (callbacks are stable; still declared before any conditional returns)
  const onUploaded = (absoluteUrl: string) => setHome((h) => (h ? { ...h, imageUrl: absoluteUrl } : h));

  const toggleChecked = async (value: boolean) => {
    if (!home) return;
    const prev = home;
    try {
      setHome({ ...home, isChecked: value });
      await api.patch(`/homes/${home.id}`, { isChecked: value });
      toast({ title: value ? "Included in To-Do" : "Excluded from To-Do" });
    } catch {
      setHome(prev);
      toast({ title: "Could not update", variant: "destructive" });
    }
  };

  const deleteHome = async () => {
    if (!home || deleting) return;
    if (!confirm("Delete this home? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/homes/${home.id}`);
      toast({ title: "Home deleted" });
      navigate("/app/homes");
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const openAddTrackable = useCallback((roomId?: string) => {
    setPrefillRoomId(roomId);
    setTrackableOpen(true);
  }, []);

  /* -------- guards (AFTER all hooks) -------- */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="h-56 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-24 rounded-xl border bg-muted/40" />
          <div className="h-24 rounded-xl border bg-muted/40" />
          <div className="h-24 rounded-xl border bg-muted/40" />
        </div>
      </div>
    );
  }

  if (!home) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Home not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The requested home could not be loaded.</p>
        <Button className="mt-6" onClick={() => navigate("/app/homes")}>Back to Homes</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* ======= Hero ======= */}
      <div className="overflow-hidden rounded-2xl border shadow-sm bg-brand-background">
        <div className="relative h-56 w-full">
          <HomePhotoDropzone homeId={home.id} imageUrl={img} onUploaded={onUploaded} className="h-56 w-full" />
          {!home.isChecked && (
            <span className="absolute top-3 left-3 rounded bg-surface px-2 py-0.5 text-[11px] text-white">Not in To-Do</span>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold leading-tight">
              {`${home.address}, ${home.city}, ${home.state} ${home.zip}`}
            </h1>
            {home.nickname ? (
              <div className="mt-0.5 text-sm text-muted-foreground">{home.nickname}</div>
            ) : null}
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{home.city}, {home.state}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Zillow */}
            <Button
              variant="default"
              onClick={() => {
                if (!hasAddress) {
                  toast({ title: "Missing address", description: "Need address, city, state, and ZIP to open Zillow.", variant: "destructive" });
                  return;
                }
                const url =
                  zillowUrl ??
                  buildZillowUrl({
                    address: home.address,
                    apartment: (home as any).apartment ?? null,
                    city: home.city,
                    state: home.state,
                    zip: home.zip,
                  });

                if (!url) {
                  toast({
                    title: "Couldn’t create Zillow link",
                    description: "The address format might be unusual. Try editing the address on the Details tab.",
                    variant: "destructive",
                  });
                  return;
                }
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="flex items-center gap-2"
              disabled={!hasAddress}
              title={hasAddress ? "Open this address on Zillow" : "Enter full address to enable"}
            >
              <img src="/images/zillow-logo.png" alt="Zillow" className="h-5 w-5 object-contain" />
              <span>View on Zillow</span>
            </Button>

            {/* Include in To-Do */}
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm">
              <Switch checked={home.isChecked} onCheckedChange={toggleChecked} />
              <span>Include in To-Do</span>
            </div>

            {/* Edit / Delete */}
            <Button variant="destructive" className="gap-2" onClick={deleteHome} disabled={deleting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ======= Tabs ======= */}
      <nav className="mt-4 border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Home tabs">
        <ul className="flex -mb-px">
          {(
            ["overview", "details", "rooms", "features", "services", "docs"] as TabKey[]
          ).map((k) => {
            const active = tab === k;
            return (
              <li key={k}>
                <button
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTabAndUrl(k)}
                  className={
                    "px-3 py-2 text-sm border-b-2 mr-1 transition-colors " +
                    (active
                      ? "border-brand-primary text-brand-primary font-semibold"
                      : "border-transparent text-slate-600 hover:text-brand-primary dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-500")
                  }
                >
                  {k === "overview" ? "Overview" :
                    k === "details" ? "Details" :
                      k === "rooms" ? "Rooms" :
                        k === "features" ? "Features" :
                          k === "services" ? "Services" : "Photos & Docs"}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>


      {/* ======= Tab Panels ======= */}
      {tab === "overview" && (
        <>
          {/* Quick add common items (Yes/No prompts) */}
          <div className="mt-4">
            <QuickPromptsBar
              homeId={home.id}
              rooms={home.rooms ?? []}
              trackables={trackablesLite}
              onCreated={() => {
                refetchTrackablesLite();
                toast({
                  title: "Added to your home",
                  description: "We created routine tasks for it. You can add brand/model later.",
                });
              }}
            />
          </div>

          {/* Status strip */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatusCard icon={<AlertCircle className="h-5 w-5" />} label="Overdue" value={tasksLoading ? "…" : String(overdueCount)} tone="danger" />
            <StatusCard icon={<Clock className="h-5 w-5" />} label="Due soon (7d)" value={tasksLoading ? "…" : String(dueSoonCount)} tone="warn" />
            <StatusCard
              icon={<Target className="h-5 w-5" />} label="Maintenance score"
              value={tasksLoading ? "…" : `${score}`} suffix={tasksLoading ? "" : "/ 100"}
              tone={tasksLoading ? "neutral" : score >= 80 ? "good" : score >= 60 ? "ok" : "warn"}
            />
            <div className="rounded-2xl border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><ListChecks className="h-5 w-5" /><span>Tasks</span></div>
              <Button size="sm" onClick={() => navigate(`/app/tasks?homeId=${encodeURIComponent(home.id)}`)} className="ml-2">View Tasks</Button>
            </div>
          </div>

          {/* Recent + Upcoming Tasks */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Upcoming Tasks */}
            <div className="rounded-2xl border bg-card p-4 lg:col-span-8 order-2 lg:order-1">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">Upcoming Tasks</div>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/app/tasks?homeId=${encodeURIComponent(home.id)}`)}>
                  View all
                </Button>
              </div>

              {tasksLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : homeTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">All caught up! No tasks due—check back soon.</div>
              ) : (
                <ul className="space-y-2">
                  {homeTasks.map((t) => {
                    const overdue = isOverdue(t);
                    const soon = isDueSoon(t);
                    // room / trackable context badges (best-effort)
                    const roomName = (t as any).roomName as string | undefined;
                    const trackableName = (t as any).trackableName as string | undefined;
                    return (
                      <li key={t.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm">{t.title || "Task"}</div>
                          <div className="text-xs text-muted-foreground">
                            {(t.category || t.taskType || "General")}
                            {t.dueDate ? ` • due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                            {roomName ? ` • ${roomName}` : ""}
                            {trackableName ? ` • ${trackableName}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {overdue && <span className="chip-danger">Overdue</span>}
                          {!overdue && soon && <span className="chip-warn">Due soon</span>}
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/app/tasks?taskId=${encodeURIComponent(t.id)}`)}>Open</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-4 lg:col-span-4 order-1 lg:order-2">
              <div className="mb-2 font-semibold">Recent Activity</div>
              {recent.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              ) : (
                <ul className="space-y-2">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div className="flex-1">
                        <div className="text-sm">{r.title}</div>
                        {r.when ? <div className="text-xs text-muted-foreground">{new Date(r.when).toLocaleDateString()}</div> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "details" && (
        <div className="mt-6" ref={metaRef}>
          <HomeMetaCard
            home={home}
            onUpdated={(next) => {
              setHome((h) => (h ? { ...h, ...next } : h));
              setSummary((s) =>
                s
                  ? {
                    ...s,
                    squareFeet: (next.squareFeet as any) ?? s.squareFeet,
                    yearBuilt: (next.yearBuilt as any) ?? s.yearBuilt,
                    hasCentralAir: typeof (next as any).hasCentralAir === "boolean" ? (next as any).hasCentralAir : s.hasCentralAir,
                    hasBaseboard: typeof (next as any).hasBaseboard === "boolean" ? (next as any).hasBaseboard : s.hasBaseboard,
                    features: Array.isArray((next as any).features) ? ((next as any).features as string[]) : s.features,
                    nickname: typeof next.nickname === "string" ? (next.nickname as string) : s.nickname,
                  }
                  : s
              );
            }}
          />
        </div>
      )}

      {tab === "rooms" && (
        <div className="mt-6 rounded-2xl border bg-card p-4">
          {/* Optional: also show QuickPromptsBar here if you want it visible per-room */}
          {/* <QuickPromptsBar homeId={home.id} rooms={home.rooms ?? []} trackables={trackablesLite} onCreated={() => { refetchTrackablesLite(); }} /> */}
          <RoomsPanel homeId={home.id} tasksByRoom={tasksByRoom} onAddTrackable={(roomId) => { setPrefillRoomId(roomId); setTrackableOpen(true); }} />
        </div>
      )}

      {tab === "features" && (
        <div className="mt-6 rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-1">Features</h2>
          <p className="text-sm text-muted-foreground">Coming soon — curated quick-add + suggestions.</p>
        </div>
      )}

      {tab === "services" && (
        <div className="mt-6 rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-1">Services</h2>
          <p className="text-sm text-muted-foreground">Keep your HVAC/boiler and other providers here. (MVP placeholder.)</p>
        </div>
      )}

      {tab === "docs" && (
        <div className="mt-6 rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-1">Photos & Docs</h2>
          <p className="text-sm text-muted-foreground">Upload invoices, warranties, manuals, etc. (MVP placeholder.)</p>
        </div>
      )}

      {/* Add Trackable Modal */}
      <TrackableModal
        isOpen={trackableOpen}
        onClose={() => { setTrackableOpen(false); setPrefillRoomId(undefined); }}
        onSave={() => { /* optionally refresh trackables/rooms if needed */ }}
        initialData={prefillRoomId ? { userDefinedName: "", roomId: prefillRoomId, homeId: home.id } : { userDefinedName: "", homeId: home.id }}
      />
    </div>
  );
}

/* ====================== Small components ====================== */
function StatusCard({
  icon, label, value, suffix, tone = "neutral",
}: {
  icon: React.ReactNode; label: string; value: string | number; suffix?: string;
  tone?: "neutral" | "good" | "ok" | "warn" | "danger";
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/30"
      : tone === "ok"
        ? "border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/30"
        : tone === "warn"
          ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/30"
          : tone === "danger"
            ? "border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/30"
            : "border-slate-200 bg-card dark:border-slate-800 dark:bg-slate-900/40";

  const textTone =
    tone === "good"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "ok"
        ? "text-blue-700 dark:text-blue-300"
        : tone === "warn"
          ? "text-amber-700 dark:text-amber-300"
          : tone === "danger"
            ? "text-red-700 dark:text-red-300"
            : "text-slate-800 dark:text-slate-100";

  return (
    <div className={`rounded-2xl border ${toneClasses} p-4`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <div className={`mt-1 text-2xl font-semibold ${textTone}`}>
        {value}{suffix ? <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}