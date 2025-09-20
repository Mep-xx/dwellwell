// dwellwell-client/src/pages/Home.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Room } from "@shared/types/room";
import type { Task } from "@shared/types/task";
import { api } from "@/utils/api";
import { resolveHomeImageUrl } from "@/utils/images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Pencil, Trash2, MapPin, AlertCircle, Clock, Target, ListChecks,
  Plus, ArrowUp, ArrowDown, CheckCircle2
} from "lucide-react";
import HomePhotoDropzone from "@/components/ui/HomePhotoDropzone";
import { useToast } from "@/components/ui/use-toast";
import { buildZillowUrl } from "@/utils/zillowUrl";
import HomeMetaCard from "@/components/redesign/HomeMetaCard";
import type { HomeWithMeta } from "@/types/extended";
import { getRoomVisual } from "@/utils/roomVisuals";
import RoomsPanel from "@/components/redesign/RoomsPanel";

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
type TrackableRow = { id: string; name: string; status?: string | null; nextDueDate?: string | null };

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

  const [home, setHome] = useState<(HomeWithMeta & { rooms?: Room[] }) | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);

  // extras
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [homeTrackables, setHomeTrackables] = useState<TrackableRow[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newRoom, setNewRoom] = useState<{ name: string; type: string; floor: number | null }>({ name: "", type: "", floor: 1 });

  const metaRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState<TabKey>("overview");

  /* -------- load home + summary -------- */
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

  /* -------- load tasks for status strip -------- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setTasksLoading(true); setTaskError(null);
      try {
        const res = await api.get("/tasks", { params: { homeId: id, status: "active" } });
        if (cancelled) return;
        setActiveTasks(Array.isArray(res.data) ? res.data : []);
      } catch { if (!cancelled) setTaskError("Could not load tasks"); }
      finally { if (!cancelled) setTasksLoading(false); }
    }
    load(); return () => { cancelled = true; };
  }, [id]);

  /* -------- recent activity -------- */
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
          title: t.title || t.name || "Completed task",
          when: t.completedAt || t.doneAt || t.updatedAt || null,
          status: "Completed"
        })));
      } catch { setRecent([]); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  /* -------- home-level trackables -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const [a, b] = await Promise.allSettled([
          api.get("/trackables", { params: { homeId: id, scope: "home" } }),
          api.get("/trackables", { params: { homeId: id, roomId: null } }),
        ]);
        if (cancelled) return;

        const rows: TrackableRow[] = [];
        for (const r of [a, b]) {
          if (r.status === "fulfilled" && Array.isArray(r.value.data)) {
            for (const t of r.value.data) {
              rows.push({
                id: t.id,
                name: t.userDefinedName || t.name || "Trackable",
                status: t.status || null,
                nextDueDate: t.nextDueDate || t.next_due || null,
              });
            }
          }
        }
        const seen = new Set<string>(); const dedup = rows.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true)));
        setHomeTrackables(dedup.slice(0, 6));
      } catch { setHomeTrackables([]); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  /* -------- derived values -------- */
  const img = resolveHomeImageUrl(home?.imageUrl);
  const zillowUrl = home && buildZillowUrl({
    address: home.address, apartment: (home as any).apartment ?? null,
    city: home.city, state: home.state, zip: home.zip,
  });

  const overdueCount = activeTasks.filter(isOverdue).length;
  const dueSoonCount = activeTasks.filter(isDueSoon).length;
  const score = maintenanceScore(overdueCount, dueSoonCount);

  const tasksByRoom: Record<string, { overdue: number; soon: number }> = {};
  for (const t of activeTasks) {
    const rid = (t as any).roomId as string | undefined;
    if (!rid) continue;
    if (!tasksByRoom[rid]) tasksByRoom[rid] = { overdue: 0, soon: 0 };
    if (isOverdue(t)) tasksByRoom[rid].overdue++; else if (isDueSoon(t)) tasksByRoom[rid].soon++;
  }

  /* -------- actions -------- */
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

  const handleEditMeta = () => {
    setTab("details");
    setTimeout(() => {
      metaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const createRoom = async () => {
    if (!home) return;
    if (!newRoom.name.trim()) { toast({ title: "Please enter a room name", variant: "destructive" }); return; }
    setAdding(true);
    try {
      const res = await api.post("/rooms", {
        homeId: home.id, name: newRoom.name.trim(), type: newRoom.type || undefined, floor: newRoom.floor ?? undefined,
      });
      const created: Room | null = res?.data ?? null;
      setHome((h) =>
        h ? { ...h, rooms: [...(h.rooms ?? []), created ?? { id: crypto.randomUUID(), name: newRoom.name, type: newRoom.type, floor: newRoom.floor } as any] } : h
      );
      setAddOpen(false); setNewRoom({ name: "", type: "", floor: 1 });
    } catch { toast({ title: "Could not create room", variant: "destructive" }); }
    finally { setAdding(false); }
  };

  const moveRoom = async (idx: number, dir: -1 | 1) => {
    if (!home?.rooms) return;
    const next = [...home.rooms]; const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setHome({ ...home, rooms: next });
    try { await api.post("/rooms/reorder", { roomIds: next.map((r) => r.id) }); } catch {}
  };

  /* -------- guards -------- */
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
      <div className="overflow-hidden rounded-2xl border shadow-sm bg-white">
        <div className="relative h-56 w-full">
          <HomePhotoDropzone homeId={home.id} imageUrl={img} onUploaded={onUploaded} className="h-56 w-full" />
          {!home.isChecked && (
            <span className="absolute top-3 left-3 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] text-white">Not in To-Do</span>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t bg-white p-4 md:flex-row md:items-center md:justify-between">
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
              variant="secondary"
              onClick={() => {
                if (!zillowUrl) {
                  toast({ title: "Missing address", description: "Need address, city, state, and ZIP to open Zillow.", variant: "destructive" });
                  return;
                }
                window.open(zillowUrl, "_blank", "noopener,noreferrer");
              }}
              className="flex items-center gap-2"
              disabled={!zillowUrl}
              title={zillowUrl ? "Open this address on Zillow" : "Enter full address to enable"}
            >
              <img src="/images/zillow-logo.png" alt="Zillow" className="h-5 w-5 object-contain" />
              <span>View on Zillow</span>
            </Button>

            {/* Include in To-Do */}
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm">
              <Switch checked={home.isChecked} onCheckedChange={toggleChecked} />
              <span>Include in To-Do</span>
            </div>

            {/* Edit / Delete */}
            <Button variant="outline" className="gap-2" onClick={handleEditMeta}><Pencil className="h-4 w-4" /> Edit</Button>
            <Button variant="destructive" className="gap-2" onClick={deleteHome} disabled={deleting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ======= Tabs ======= */}
      <div className="mt-4 border-b">
        {(["overview","details","rooms","features","services","docs"] as TabKey[]).map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm -mb-px border-b-2 mr-1 ${
              tab === key ? "border-brand-primary text-brand-primary font-semibold"
                          : "border-transparent text-gray-600 hover:text-brand-primary"
            }`}
          >
            {key === "overview" ? "Overview" :
             key === "details"  ? "Details"  :
             key === "rooms"    ? "Rooms"    :
             key === "features" ? "Features" :
             key === "services" ? "Services" : "Photos & Docs"}
          </button>
        ))}
      </div>

      {/* ======= Tab Panels ======= */}
      {tab === "overview" && (
        <>
          {/* Status strip */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatusCard icon={<AlertCircle className="h-5 w-5" />} label="Overdue" value={tasksLoading ? "…" : String(overdueCount)} tone="danger" />
            <StatusCard icon={<Clock className="h-5 w-5" />} label="Due soon (7d)" value={tasksLoading ? "…" : String(dueSoonCount)} tone="warn" />
            <StatusCard
              icon={<Target className="h-5 w-5" />} label="Maintenance score"
              value={tasksLoading ? "…" : `${score}`} suffix={tasksLoading ? "" : "/ 100"}
              tone={tasksLoading ? "neutral" : score >= 80 ? "good" : score >= 60 ? "ok" : "warn"}
            />
            <div className="rounded-2xl border bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><ListChecks className="h-5 w-5" /><span>Tasks</span></div>
              <Button size="sm" onClick={() => navigate(`/app/tasks?homeId=${encodeURIComponent(home.id)}`)} className="ml-2">View Tasks</Button>
            </div>
          </div>

          {/* Recent + Home Maintenance */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4">
              <div className="mb-2 font-semibold">Recent Activity</div>
              {recent.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              ) : (
                <ul className="space-y-2">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
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

            <div className="rounded-2xl border bg-white p-4">
              <div className="mb-2 font-semibold">Home Maintenance</div>
              {homeTrackables.length === 0 ? (
                <div className="text-sm text-muted-foreground">No home-based items yet.</div>
              ) : (
                <ul className="space-y-2">
                  {homeTrackables.map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                      <div>
                        <div className="text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(t.status || "In Use")}{t.nextDueDate ? ` • Next: ${new Date(t.nextDueDate).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/app/trackables/${encodeURIComponent(t.id)}`)}>Open</Button>
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
        <div className="mt-6 rounded-2xl border bg-white p-4">
          <RoomsPanel homeId={home.id} tasksByRoom={tasksByRoom} />
        </div>
      )}

      {tab === "features" && (
        <div className="mt-6 rounded-2xl border bg-white p-4">
          <h2 className="text-sm font-semibold mb-1">Features</h2>
          <p className="text-sm text-muted-foreground">Coming soon — curated quick-add + suggestions (from the old page).</p>
        </div>
      )}

      {tab === "services" && (
        <div className="mt-6 rounded-2xl border bg-white p-4">
          <h2 className="text-sm font-semibold mb-1">Services</h2>
          <p className="text-sm text-muted-foreground">Keep your HVAC/boiler and other providers here. (MVP placeholder.)</p>
        </div>
      )}

      {tab === "docs" && (
        <div className="mt-6 rounded-2xl border bg-white p-4">
          <h2 className="text-sm font-semibold mb-1">Photos & Docs</h2>
          <p className="text-sm text-muted-foreground">Upload invoices, warranties, manuals, etc. (MVP placeholder.)</p>
        </div>
      )}

      {/* Add Room Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg relative">
            <div className="text-lg font-semibold mb-2">Add Room</div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-700 mb-1">Name</div>
                <input className="w-full border rounded px-3 py-2" placeholder="e.g., Living Room"
                  value={newRoom.name} onChange={(e) => setNewRoom((v) => ({ ...v, name: e.target.value }))} />
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">Type</div>
                <input className="w-full border rounded px-3 py-2" placeholder="e.g., Living Room"
                  value={newRoom.type} onChange={(e) => setNewRoom((v) => ({ ...v, type: e.target.value }))} />
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">Floor</div>
                <input type="number" className="w-full border rounded px-3 py-2" placeholder="e.g., 1"
                  value={newRoom.floor ?? ""} onChange={(e) => setNewRoom((v) => ({ ...v, floor: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={createRoom} disabled={adding}>{adding ? "Saving…" : "Save Room"}</Button>
            </div>
          </div>
        </div>
      )}
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
    tone === "good"   ? "border-emerald-200 bg-emerald-50/70" :
    tone === "ok"     ? "border-blue-200 bg-blue-50/70" :
    tone === "warn"   ? "border-amber-200 bg-amber-50/70" :
    tone === "danger" ? "border-red-200 bg-red-50/70" :
                        "border-gray-200 bg-white";
  const textTone =
    tone === "good"   ? "text-emerald-700" :
    tone === "ok"     ? "text-blue-700" :
    tone === "warn"   ? "text-amber-700" :
    tone === "danger" ? "text-red-700" :
                        "text-gray-800";

  return (
    <div className={`rounded-2xl border ${toneClasses} p-4`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <div className={`mt-1 text-2xl font-semibold ${textTone}`}>
        {value}{suffix ? <span className="text-sm text-gray-500 ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}