// dwellwell-client/src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Room } from "@shared/types/room";
import { api } from "@/utils/api";
import { resolveHomeImageUrl } from "@/utils/images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, HomeIcon, Ruler, Calendar, ChevronRight } from "lucide-react";
import HomePhotoDropzone from "@/components/ui/HomePhotoDropzone";
import { useToast } from "@/components/ui/use-toast";
import HomeMetaCard from "@/components/redesign/HomeMetaCard";
import type { HomeWithMeta } from "@/types/extended";

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

export default function HomePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [home, setHome] = useState<HomeWithMeta & { rooms?: Room[] } | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
    return () => { cancelled = true; };
  }, [id]);

  const img = useMemo(() => resolveHomeImageUrl(home?.imageUrl), [home?.imageUrl]);
  const label = useMemo(() => {
    if (!home) return "";
    return home.nickname || `${home.address}, ${home.city}, ${home.state}`;
  }, [home]);

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
        <Button className="mt-6" onClick={() => navigate("/app/homes")}>
          Back to Homes
        </Button>
      </div>
    );
  }

  const sq = summary?.squareFeet ?? home.squareFeet ?? null;
  const yr = summary?.yearBuilt ?? home.yearBuilt ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* Header / Hero */}
      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <div className="relative h-56 w-full">
          <HomePhotoDropzone homeId={home.id} imageUrl={img} onUploaded={onUploaded} className="h-56 w-full" />
          {!home.isChecked && (
            <span className="absolute top-3 left-3 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] text-white">Not in To-Do</span>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t bg-background p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{home.city}, {home.state} {home.zip}</span>
            </div>
            <h1 className="mt-0.5 text-xl font-semibold leading-tight">{label}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
              <Switch checked={home.isChecked} onCheckedChange={toggleChecked} />
              <span>Include in To-Do</span>
            </div>

            <Button variant="outline" className="gap-2" onClick={() => navigate(`/app/homes/${home.id}`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" className="gap-2" onClick={deleteHome} disabled={deleting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<HomeIcon className="h-5 w-5" />} label="Address" value={`${home.address}${home.apartment ? `, ${home.apartment}` : ""}`} />
        <StatCard icon={<Ruler className="h-5 w-5" />} label="Square feet" value={sq ? sq.toLocaleString() : "—"} />
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Year built" value={yr ? String(yr) : "—"} />
      </div>

      {/* Meta editor */}
      <div className="mt-6">
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
                      typeof (next as any).hasCentralAir === "boolean" ? (next as any).hasCentralAir : s.hasCentralAir,
                    hasBaseboard:
                      typeof (next as any).hasBaseboard === "boolean" ? (next as any).hasBaseboard : s.hasBaseboard,
                    features: Array.isArray((next as any).features) ? ((next as any).features as string[]) : s.features,
                    nickname: typeof next.nickname === "string" ? (next.nickname as string) : s.nickname,
                  }
                : s
            );
          }}
        />
      </div>

      {/* Rooms preview */}
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
                {r.floor ? <div className="text-xs text-muted-foreground">Floor {r.floor}</div> : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">No rooms yet. You can add rooms from the Rooms section.</div>
        )}
      </div>

      {/* Counts */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CountCard label="Rooms" value={summary?.counts.rooms ?? home.rooms?.length ?? 0} />
        <CountCard label="Trackables" value={summary?.counts.trackables ?? 0} />
        <CountCard label="Vehicles" value={summary?.counts.vehicles ?? 0} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
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
