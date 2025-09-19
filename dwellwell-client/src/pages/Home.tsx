// dwellwell-client/src/pages/Home.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Room } from "@shared/types/room";
import type { Task } from "@shared/types/task";
import { api } from "@/utils/api";
import { resolveHomeImageUrl } from "@/utils/images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  MapPin,
  ChevronRight,
  AlertCircle,
  Clock,
  Target,
  ListChecks,
} from "lucide-react";
import HomePhotoDropzone from "@/components/ui/HomePhotoDropzone";
import { useToast } from "@/components/ui/use-toast";
import { buildZillowUrl } from "@/utils/zillowUrl";
import HomeMetaCard from "@/components/redesign/HomeMetaCard";
import type { HomeWithMeta } from "@/types/extended";

/* ====================== Types ====================== */

type Summary = {
  id: string;
  nickname: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  squareFeet: number | null;
  yearBuilt: number | null;
  hasCentralAir: boolean;
  hasBaseboard: boolean;
  features: string[];
  counts: { rooms: number; vehicles: number; trackables: number };
};

/* ====================== Helpers ====================== */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function isOverdue(t: Task) {
  if (t.status !== "PENDING") return false;
  if (!t.dueDate) return false;
  return new Date(t.dueDate).getTime() < Date.now();
}
function isDueSoon(t: Task) {
  if (t.status !== "PENDING") return false;
  if (!t.dueDate) return false;
  const due = new Date(t.dueDate).getTime();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return due >= now && due <= now + sevenDays;
}
/** Simple score: 100 - 60*overdue - 20*soon (clamped 0..100). */
function maintenanceScore(overdue: number, soon: number) {
  return clamp(100 - overdue * 60 - soon * 20, 0, 100);
}

/* ====================== Page ====================== */

export default function HomePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [home, setHome] = useState<(HomeWithMeta & { rooms?: Room[] }) | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Tasks for status strip
  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Ref to HomeMetaCard area so Edit can scroll and toggle
  const metaRef = useRef<HTMLDivElement | null>(null);

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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* -------- load tasks for status strip -------- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setTasksLoading(true);
      setTaskError(null);
      try {
        const res = await api.get("/tasks", { params: { homeId: id, status: "active" } });
        if (cancelled) return;
        const list: Task[] = Array.isArray(res.data) ? res.data : [];
        setActiveTasks(list);
      } catch {
        if (!cancelled) setTaskError("Could not load tasks");
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* -------- derived values (NO hooks here to avoid order problems) -------- */
  const img = resolveHomeImageUrl(home?.imageUrl);
  const label = home ? home.nickname || `${home.address}, ${home.city}, ${home.state}` : "";
  const zillowUrl =
    home &&
    buildZillowUrl({
      address: home.address,
      apartment: (home as any).apartment ?? null,
      city: home.city,
      state: home.state,
      zip: home.zip,
    });

  const overdueCount = activeTasks.filter(isOverdue).length;
  const dueSoonCount = activeTasks.filter(isDueSoon).length;
  const score = maintenanceScore(overdueCount, dueSoonCount);

  /* -------- actions -------- */
  const onUploaded = (absoluteUrl: string) => {
    setHome((h) => (h ? { ...h, imageUrl: absoluteUrl } : h));
  };

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
    } finally {
      setDeleting(false);
    }
  };

  const handleEditMeta = () => {
    metaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      const root = metaRef.current;
      if (!root) return;
      const editBtn = Array.from(root.querySelectorAll("button")).find(
        (b) => (b.textContent || "").trim().toLowerCase() === "edit"
      );
      editBtn?.click();
    }, 250);
  };

  /* -------- guards (no hooks below this) -------- */
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
        <p className="mt-2 text-sm text-muted-foreground">
          The requested home could not be loaded.
        </p>
        <Button className="mt-6" onClick={() => navigate("/app/homes")}>
          Back to Homes
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* ======= Hero ======= */}
      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <div className="relative h-56 w-full">
          <HomePhotoDropzone
            homeId={home.id}
            imageUrl={img}
            onUploaded={onUploaded}
            className="h-56 w-full"
          />
          {!home.isChecked && (
            <span className="absolute top-3 left-3 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] text-white">
              Not in To-Do
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t bg-background p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {home.city}, {home.state} {home.zip}
              </span>
            </div>
            <h1 className="mt-0.5 text-xl font-semibold leading-tight">
              {label}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Zillow */}
            <Button
              variant="secondary"
              onClick={() => {
                if (!zillowUrl) {
                  toast({
                    title: "Missing address",
                    description:
                      "Need address, city, state, and ZIP to open Zillow.",
                    variant: "destructive",
                  });
                  return;
                }
                window.open(zillowUrl, "_blank", "noopener,noreferrer");
              }}
              className="flex items-center gap-2"
              disabled={!zillowUrl}
              title={
                zillowUrl
                  ? "Open this address on Zillow"
                  : "Enter full address to enable"
              }
            >
              <img
                src="/images/zillow-logo.png"
                alt="Zillow"
                className="h-5 w-5 object-contain"
              />
              <span>View on Zillow</span>
            </Button>

            {/* Include in To-Do */}
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
              <Switch checked={home.isChecked} onCheckedChange={toggleChecked} />
              <span>Include in To-Do</span>
            </div>

            {/* Edit / Delete */}
            <Button variant="outline" className="gap-2" onClick={handleEditMeta}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={deleteHome}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ======= Status strip (Overdue / Due soon / Score / Tasks link) ======= */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatusCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Overdue"
          value={tasksLoading ? "…" : String(overdueCount)}
          tone="danger"
        />
        <StatusCard
          icon={<Clock className="h-5 w-5" />}
          label="Due soon (7d)"
          value={tasksLoading ? "…" : String(dueSoonCount)}
          tone="warn"
        />
        <StatusCard
          icon={<Target className="h-5 w-5" />}
          label="Maintenance score"
          value={tasksLoading ? "…" : `${score}`}
          suffix={tasksLoading ? "" : "/ 100"}
          tone={tasksLoading ? "neutral" : score >= 80 ? "good" : score >= 60 ? "ok" : "warn"}
        />
        <div className="rounded-2xl border bg-background p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ListChecks className="h-5 w-5" />
            <span>Tasks</span>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/app/tasks?homeId=${encodeURIComponent(home.id)}`)}
            className="ml-2"
          >
            View Tasks
          </Button>
        </div>
      </div>

      {/* ======= Details (Meta) ======= */}
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
                    hasCentralAir:
                      typeof (next as any).hasCentralAir === "boolean"
                        ? (next as any).hasCentralAir
                        : s.hasCentralAir,
                    hasBaseboard:
                      typeof (next as any).hasBaseboard === "boolean"
                        ? (next as any).hasBaseboard
                        : s.hasBaseboard,
                    features: Array.isArray((next as any).features)
                      ? ((next as any).features as string[])
                      : s.features,
                    nickname:
                      typeof next.nickname === "string"
                        ? (next.nickname as string)
                        : s.nickname,
                  }
                : s
            );
          }}
        />
      </div>

      {/* ======= Rooms preview ======= */}
      <div className="mt-6 rounded-2xl border bg-background">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-sm font-semibold">Rooms</h2>
          <button
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            onClick={() => navigate(`/app/homes/${home.id}`)}
            title="Manage rooms"
          >
            Manage <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {home.rooms && home.rooms.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.rooms.slice(0, 9).map((r) => (
              <li key={r.id} className="rounded-lg border p-3 text-sm hover:bg-muted/50">
                <div className="font-medium">{r.name || r.type}</div>
                {r.floor ? (
                  <div className="text-xs text-muted-foreground">Floor {r.floor}</div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            No rooms yet. You can add rooms from the Rooms section.
          </div>
        )}
      </div>

      {/* ======= Counts (Vehicles removed) ======= */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CountCard
          label="Rooms"
          value={summary?.counts.rooms ?? home.rooms?.length ?? 0}
        />
        <CountCard label="Trackables" value={summary?.counts.trackables ?? 0} />
      </div>
    </div>
  );
}

/* ====================== Small components ====================== */

function StatusCard({
  icon,
  label,
  value,
  suffix,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  tone?: "neutral" | "good" | "ok" | "warn" | "danger";
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-300 bg-emerald-50/60"
      : tone === "ok"
      ? "border-blue-300 bg-blue-50/60"
      : tone === "warn"
      ? "border-amber-300 bg-amber-50/60"
      : tone === "danger"
      ? "border-red-300 bg-red-50/60"
      : "border-gray-200 bg-background";
  const textTone =
    tone === "good"
      ? "text-emerald-700"
      : tone === "ok"
      ? "text-blue-700"
      : tone === "warn"
      ? "text-amber-700"
      : tone === "danger"
      ? "text-red-700"
      : "text-gray-800";

  return (
    <div className={`rounded-2xl border ${toneClasses} p-4`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-2xl font-semibold ${textTone}`}>
        {value}
        {suffix ? <span className="text-sm text-gray-500 ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
