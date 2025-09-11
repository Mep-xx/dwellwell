// dwellwell-client/src/pages/Home.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MapboxAddress from "@/components/MapboxAddress";
import HomePhotoDropzone from "@/components/ui/HomePhotoDropzone";
import { buildZillowUrl } from "@/utils/zillowUrl";
import { RoomsPanel } from "@/components/RoomsPanel";

import type { AxiosError } from "axios";
import {
  Flame, PlugZap, Sun, Droplets, Waves, Bath, Zap, Sprout, Home as HomeIcon,
  GripVertical, Pencil, Plus, MoveUpRight
} from "lucide-react";

// Constants
import {
  ROOF_TYPES,
  SIDING_TYPES,
  ARCHITECTURAL_STYLES,
  FEATURE_SUGGESTIONS as RAW_FEATURE_SUGGESTIONS,
  HOUSE_ROOM_TEMPLATES,
} from "@constants";

/* ============================== Helpers =============================== */

const toAbsoluteUrl = (url: string) =>
  !url
    ? url
    : /^(https?:)?\/\//i.test(url)
      ? url
      : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;

const acresToSqft = (acres: number) => acres * 43560;
const sqftToAcres = (sqft: number) => sqft / 43560;

function renderAddressLine(h: any) {
  if (!h) return "";
  const line1 =
    h.addressLine1 ?? h.street1 ?? h.address1 ?? h.street ?? h.address ?? "";
  const line2 = h.addressLine2 ?? h.street2 ?? h.address2 ?? "";
  const city = h.city;
  const state = h.state ?? h.province;
  const zip = h.postalCode ?? h.zip ?? h.zipCode;
  const country = h.country;

  const compact = (xs: (string | null | undefined)[]) =>
    (xs.filter(Boolean) as string[]);
  const upper = compact([line1, line2]).join(" · ");
  const lower = compact([
    compact([city, state].filter(Boolean) as string[]).join(", "),
    zip,
    country,
  ]).join(" ");
  return compact([upper, lower]).join(" — ");
}

/**
 * Build Home update payload that matches your Prisma model.
 * We SAVE lotSize as **sqft** but DISPLAY as acres by default.
 */
function buildHomeUpdatePayload(
  home: LoadedHome,
  features: string[],
  lotUnit: "acres" | "sqft"
) {
  const lotSqft =
    home.lotSize == null
      ? undefined
      : lotUnit === "acres"
        ? Math.round(Number(home.lotSize) * 43560)
        : Number(home.lotSize);

  const map = {
    nickname: home.nickname?.trim() || undefined,
    squareFeet:
      typeof home.squareFeet === "number" ? home.squareFeet : undefined,
    lotSize: typeof lotSqft === "number" ? lotSqft : undefined,
    yearBuilt: typeof home.yearBuilt === "number" ? home.yearBuilt : undefined,

    hasCentralAir:
      typeof home.hasCentralAir === "boolean" ? home.hasCentralAir : undefined,
    hasBaseboard:
      typeof home.hasBaseboard === "boolean" ? home.hasBaseboard : undefined,
    hasHeatPump:
      typeof home.hasHeatPump === "boolean" ? home.hasHeatPump : undefined,

    roofType: home.roofType?.trim() || undefined,
    sidingType: home.sidingType?.trim() || undefined,
    architecturalStyle: home.architecturalStyle?.trim() || undefined,

    imageUrl: home.imageUrl ? toAbsoluteUrl(String(home.imageUrl)) : undefined,
    apartment: home.apartment?.trim() || undefined,

    isChecked: typeof home.isChecked === "boolean" ? home.isChecked : undefined,

    features: Array.isArray(features) ? features : undefined,
  } as const;

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(map)) if (v !== undefined) out[k] = v;
  return out;
}

/* ============================== Types =============================== */

type LoadedHome = {
  id: string;
  nickname?: string | null;
  squareFeet?: number | null;
  lotSize?: number | null; // UI value, in acres by default
  yearBuilt?: number | null;

  hasCentralAir?: boolean;
  hasBaseboard?: boolean;
  hasHeatPump?: boolean;

  roofType?: string | null;
  sidingType?: string | null;
  architecturalStyle?: string | null;

  imageUrl?: string | null;
  apartment?: string | null;

  // address fields (display only)
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;

  isChecked?: boolean;

  features: string[];
};

type RoomLite = {
  id: string;
  name?: string | null;
  type?: string | null;
  floor?: number | null;
  order?: number | null;
};

/* ========================== Suggestions =========================== */

const SUGGESTED_FEATURES = [
  "Solar Panels",
  "Irrigation System",
  "Deck",
  "Fireplace",
  "Water Softener",
  "Sump Pump",
  "EV Charger",
  "Pool",
  "Hot Tub",
  "Whole-House Generator",
] as const;

const dismissedKey = (homeId: string) =>
  `home:${homeId}:dismissed-feature-prompts`;

const FEATURE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Fireplace: Flame,
  "EV Charger": PlugZap,
  "Solar Panels": Sun,
  "Irrigation System": Sprout,
  "Water Softener": Droplets,
  Pool: Waves,
  "Hot Tub": Bath,
  "Whole-House Generator": Zap,
  Deck: HomeIcon,
  "Sump Pump": Droplets,
};

function FeatureChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = FEATURE_ICONS[label] ?? HomeIcon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${selected ? "bg-muted" : "hover:bg-muted/60"
        }`}
      title={selected ? "Remove" : "Add"}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

/* ======================= Tiny Tabs (URL-synced) ======================== */

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "features", label: "Features" },
  { key: "rooms", label: "Rooms" },
  { key: "lawn", label: "Lawn & Exterior" },
  { key: "services", label: "Services" },
  { key: "docs", label: "Photos & Docs" },
] as const;
type TabKey = typeof TABS[number]["key"];

/* ===================== Rooms Arrange Panel (inline) ==================== */

function RoomsArrangePanel({
  homeId,
}: {
  homeId: string;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/rooms", { params: { homeId } });
        if (!mounted) return;
        const list: RoomLite[] = Array.isArray(data) ? data : [];
        // stable sort by (order ?? 0), then floor, then name
        list.sort((a, b) => {
          const ao = a.order ?? 0, bo = b.order ?? 0;
          if (ao !== bo) return ao - bo;
          const af = a.floor ?? 0, bf = b.floor ?? 0;
          if (af !== bf) return af - bf;
          const an = (a.name || "").toLowerCase(), bn = (b.name || "").toLowerCase();
          return an.localeCompare(bn);
        });
        setRooms(list);
      } catch (e) {
        // noop
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [homeId]);

  const move = (idx: number, dir: -1 | 1) => {
    setRooms((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((r, i) => ({ ...r, order: i }));
    });
  };

  const persistOrder = async () => {
    try {
      await api.post(`/rooms/reorder`, {
        homeId,
        orders: rooms.map((r, i) => ({ id: r.id, order: i })),
      });
      toast({ title: "Order saved", description: "Room order updated." });
    } catch {
      toast({ title: "Save failed", description: "Couldn’t persist order.", variant: "destructive" });
    }
  };

  const createRoom = async () => {
    try {
      const payload = { homeId, name: "New Room", type: "Other", floor: 1 };
      const { data } = await api.post("/rooms", payload);
      const newRoom: RoomLite = data;
      setRooms((r) => [...r, { ...newRoom, order: r.length }]);
    } catch {
      toast({ title: "Create failed", description: "Couldn’t add a room.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading rooms…</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Drag not required—use ↑/↓ to arrange. Click ✏️ to edit a room.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={createRoom}>
            <Plus className="h-4 w-4" /> Add Room
          </Button>
          <Button onClick={persistOrder}>Save Order</Button>
        </div>
      </div>

      <ul className="divide-y rounded-lg border">
        {rooms.map((r, idx) => (
          <li key={r.id} className="flex items-center gap-3 p-3">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">
                {r.name || "Untitled Room"} {r.floor ? <span className="text-xs text-muted-foreground">· Floor {r.floor}</span> : null}
              </div>
              {r.type ? <div className="text-xs text-muted-foreground">{r.type}</div> : null}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                title="Move up"
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => move(idx, +1)}
                disabled={idx === rooms.length - 1}
                title="Move down"
              >
                ↓
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/app/rooms/${r.id}`)}
                title="Edit room"
              >
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/app/rooms/${r.id}#add-trackable`)}
                title="Add trackable to this room"
              >
                <MoveUpRight className="mr-1 h-4 w-4" />
                Add Trackable
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================== Component =============================== */
export default function Home() {
  const { id: homeId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();

  const [home, setHome] = useState<LoadedHome | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lot unit for UI: default to ACRES
  const [lotUnit, setLotUnit] = useState<"acres" | "sqft">("acres");

  // Dismissed suggestions (per-home)
  const [dismissed, setDismissed] = useState<string[]>([]);

  const FEATURE_SUGGESTIONS = useMemo(() => {
    const base = RAW_FEATURE_SUGGESTIONS.filter(
      (f) => f.toLowerCase() !== "central air"
    );
    const extras = ["Fireplace", "EV Charger", "Irrigation System", "Solar Panels", "Whole-House Generator"];
    return Array.from(new Set([...base, ...extras]));
  }, []);

  /* ---------------------------- Load ---------------------------- */

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/homes/${homeId}`);
        if (!mounted) return;
        const db = data as any;

        const uiHome: LoadedHome = {
          ...db,
          lotSize:
            db?.lotSize != null && !Number.isNaN(Number(db.lotSize))
              ? sqftToAcres(Number(db.lotSize))
              : null,
          features: Array.isArray(db?.features) ? db.features : [],
        };

        setHome(uiHome);
        setFeatures(uiHome.features ?? []);
        setLotUnit("acres");

        try {
          const raw = localStorage.getItem(dismissedKey(String(db?.id)));
          if (raw) setDismissed(JSON.parse(raw));
        } catch { /* ignore */ }
      } catch (e: any) {
        toast({
          title: "Load failed",
          description: e?.response?.data?.message || "Could not load this home.",
          variant: "destructive",
        });
        navigate("/app/homes");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  const fullAddress =
    home &&
    [home.address, home.apartment, `${home.city}, ${home.state} ${home.zip}`]
      .filter(Boolean)
      .join(", ");

  /* --------------------------- Save (explicit) --------------------------- */

  const saveAll = async () => {
    if (!home || !homeId) return;
    setSaving(true);
    const payload = buildHomeUpdatePayload(home, features, lotUnit);

    try {
      await api.put(`/homes/${homeId}`, payload);
      toast({ title: "Saved", description: "Home updated." });
    } catch (e: unknown) {
      const err = e as AxiosError<any>;
      const data = err.response?.data;

      const unrec = data?.issues?.find?.((i: any) => i?.code === "unrecognized_keys");
      if (unrec?.keys?.length) {
        const cleaned = { ...payload };
        for (const k of unrec.keys) delete cleaned[k];
        try {
          await api.put(`/homes/${homeId}`, cleaned);
          toast({ title: "Saved", description: "Home updated (after removing extra keys)." });
          setSaving(false);
          return;
        } catch { /* fall through */ }
      }

      toast({
        title: "Save failed",
        description: data?.message || "Server rejected the update.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------- Features ----------------------------- */

  const submitFeatureSuggestion = async (text: string) => {
    if (!homeId || !text.trim()) return;
    try {
      await api.post("/feature-suggestions", { homeId, text: text.trim() });
      toast({ title: "Thanks!", description: "We’ll review this feature soon." });
    } catch {
      console.warn("feature-suggestions endpoint missing; suggestion:", text);
      toast({ title: "Sent", description: "Suggestion recorded locally." });
    }
  };

  const toggleCuratedFeature = (f: string) => {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const suggestionsToShow = useMemo(() => {
    const selected = new Set(features.map((f) => f.toLowerCase()));
    const hidden = new Set(dismissed.map((d) => d.toLowerCase()));
    return SUGGESTED_FEATURES.filter(
      (s) => !selected.has(s.toLowerCase()) && !hidden.has(s.toLowerCase())
    );
  }, [features, dismissed]);

  const activeTab = (search.get("tab") as TabKey) || "overview";
  const setTab = (t: TabKey) => {
    const n = new URLSearchParams(search);
    n.set("tab", t);
    setSearch(n, { replace: true });
  };

  /* ------------------------------- UI -------------------------------- */

  if (loading || !home) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading home…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Header + Address */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏡 Home</h1>
          <div className="flex items-center space-x-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!home.isChecked}
                onChange={(e) =>
                  setHome({ ...home, isChecked: e.target.checked })
                }
              />
              <span>Include in tasks</span>
            </label>

            <Button
              variant="secondary"
              onClick={() => {
                const url = buildZillowUrl({
                  address: home.address,
                  city: home.city,
                  state: home.state,
                  zip: home.zip,
                });
                if (!url) {
                  toast({
                    title: "Missing address",
                    description: "Need address, city, state, and ZIP to open Zillow.",
                    variant: "destructive",
                  });
                  return;
                }
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="flex items-center gap-2"
            >
              <img
                src="/images/zillow-logo.png"
                alt="Zillow"
                className="h-5 w-5 object-contain"
              />
              <span>View on Zillow</span>
            </Button>

            <Button variant="outline" onClick={() => navigate("/app/homes")}>
              Back
            </Button>
            <Button onClick={saveAll} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        <div className="mt-1 text-sm text-muted-foreground">
          {renderAddressLine(home) || "No address on file"}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div role="tablist" aria-label="Home sections" className="flex flex-wrap gap-2 border-b">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              className={`px-3 py-2 text-sm -mb-px border-b-2 ${activeTab === t.key
                  ? "border-blue-600 text-blue-700 font-semibold"
                  : "border-transparent text-gray-600 hover:text-blue-700"
                }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Photo + map */}
          <div className="md:col-span-1">
            <div className="space-y-3 rounded-lg border p-3">
              <HomePhotoDropzone
                homeId={home.id}
                imageUrl={home.imageUrl || undefined}
                onUploaded={(abs) => {
                  setHome({ ...home, imageUrl: abs });
                  toast({ title: "Photo updated", description: "Main photo replaced." });
                }}
                className="aspect-[4/3] w-full overflow-hidden rounded bg-muted/40"
              />

              <MapboxAddress
                addressLine={fullAddress || ""}
                className="h-56 w-full rounded-lg border"
              />
            </div>
          </div>

          {/* Basics */}
          <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
            <div>
              <label htmlFor="nickname" className="mb-1 block text-sm font-medium">Nickname</label>
              <Input
                id="nickname"
                value={home.nickname || ""}
                onChange={(e) => setHome({ ...home, nickname: e.target.value })}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div>
              <label htmlFor="apartment" className="mb-1 block text-sm font-medium">Apartment / Unit</label>
              <Input
                id="apartment"
                value={home.apartment || ""}
                onChange={(e) => setHome({ ...home, apartment: e.target.value })}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div>
              <label htmlFor="style" className="mb-1 block text-sm font-medium">Architectural Style</label>
              <select
                id="style"
                value={home.architecturalStyle || ""}
                onChange={(e) => handleStyleChange(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="">(Select style)</option>
                {Object.entries(ARCHITECTURAL_STYLES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {String(label)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="yearBuilt" className="mb-1 block text-sm font-medium">Year Built</label>
              <Input
                id="yearBuilt"
                type="number"
                inputMode="numeric"
                value={home.yearBuilt ?? ""}
                onChange={(e) =>
                  setHome({
                    ...home,
                    yearBuilt: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 1997"
              />
            </div>

            <div>
              <label htmlFor="squareFeet" className="mb-1 block text-sm font-medium">Square Feet</label>
              <Input
                id="squareFeet"
                type="number"
                inputMode="numeric"
                value={home.squareFeet ?? ""}
                onChange={(e) =>
                  setHome({
                    ...home,
                    squareFeet: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 2500"
              />
            </div>

            <div>
              <label htmlFor="lotSize" className="mb-1 block text-sm font-medium">
                Lot Size ({lotUnit === "acres" ? "acres" : "sqft"})
              </label>
              <div className="flex gap-2">
                <Input
                  id="lotSize"
                  type="number"
                  inputMode="numeric"
                  value={home.lotSize ?? ""}
                  onChange={(e) =>
                    setHome({
                      ...home,
                      lotSize: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder={lotUnit === "acres" ? "e.g., 0.5" : "e.g., 20000"}
                />
                <select
                  className="rounded border px-2 text-sm"
                  value={lotUnit}
                  onChange={(e) => {
                    const next = e.target.value as "acres" | "sqft";
                    if (home.lotSize != null && !Number.isNaN(Number(home.lotSize))) {
                      const v = Number(home.lotSize);
                      const converted = next === "sqft" ? Math.round(acresToSqft(v)) : sqftToAcres(v);
                      setHome({ ...home, lotSize: converted });
                    }
                    setLotUnit(next);
                  }}
                >
                  <option value="acres">acres</option>
                  <option value="sqft">sqft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Roof Type</label>
              <select
                value={home.roofType || ""}
                onChange={(e) => setHome({ ...home, roofType: e.target.value || undefined })}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="">(Select…)</option>
                {ROOF_TYPES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Siding Type</label>
              <select
                value={home.sidingType || ""}
                onChange={(e) => setHome({ ...home, sidingType: e.target.value || undefined })}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="">(Select…)</option>
                {SIDING_TYPES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div className="col-span-full">
              <div className="mt-3 flex flex-wrap gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!home.hasCentralAir}
                    onChange={(e) => setHome({ ...home, hasCentralAir: e.target.checked })}
                  />
                  <span>Central Air</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!home.hasBaseboard}
                    onChange={(e) => setHome({ ...home, hasBaseboard: e.target.checked })}
                  />
                  <span>Baseboard Heating</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!home.hasHeatPump}
                    onChange={(e) => setHome({ ...home, hasHeatPump: e.target.checked })}
                  />
                  <span>Heat Pump</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "features" && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-semibold">Features</h2>

          {/* Selected */}
          <div className="mb-3">
            <div className="mb-2 text-sm font-medium">Selected</div>
            {features.length ? (
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <FeatureChip
                    key={`sel-${f}`}
                    label={f}
                    selected={true}
                    onToggle={() => toggleCuratedFeature(f)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No features yet. Pick from the list below or add your own.
              </div>
            )}
          </div>

          <div className="my-3 h-px bg-muted" />

          {/* Curated list */}
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium">Quick add</div>
            <div className="flex flex-wrap gap-2">
              {FEATURE_SUGGESTIONS.map((f) => (
                <FeatureChip
                  key={`cur-${f}`}
                  label={f}
                  selected={features.includes(f)}
                  onToggle={() => toggleCuratedFeature(f)}
                />
              ))}
            </div>
          </div>

          {/* Suggest a feature */}
          <div className="mt-4 flex items-center gap-2">
            <Input
              id="suggestFeature"
              placeholder='Suggest a feature (e.g., "Greenhouse", "Hangar Bay")'
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    await submitFeatureSuggestion(val);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            <Button
              variant="outline"
              onClick={async () => {
                const el = document.getElementById("suggestFeature") as HTMLInputElement;
                const val = el?.value.trim();
                if (val) {
                  await submitFeatureSuggestion(val);
                  el.value = "";
                }
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <p className="text-sm text-muted-foreground">
            Drag to move between floors and reorder. Click a room to edit on its own page.
          </p>
          <RoomsPanel homeId={home.id} />
        </div>
      )}

      {activeTab === "lawn" && (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Lawn & Exterior</h2>
          <p className="text-sm text-muted-foreground">Coming soon—tie lawn schedules and exterior items to this home.</p>
        </div>
      )}

      {activeTab === "services" && (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">Keep your HVAC, boiler, and other service providers here. (MVP item.)</p>
        </div>
      )}

      {activeTab === "docs" && (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Photos & Docs</h2>
          <p className="text-sm text-muted-foreground">Upload invoices, warranties, manuals, etc. (MVP item.)</p>
        </div>
      )}
    </div>
  );
}
