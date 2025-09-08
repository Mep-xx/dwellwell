// src/pages/HomeEditPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MapboxAddress from "@/components/MapboxAddress";
import HomePhotoDropzone from "@/components/ui/HomePhotoDropzone";

import { RoomsPanel } from "@/components/RoomsPanel";

import type { AxiosError } from "axios";
import {
  Flame,
  PlugZap,
  Sun,
  Droplets,
  Waves,
  Bath,
  Zap,
  Sprout,
  Home as HomeIcon,
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

// Define the fields we actually use here to avoid front-end type drift
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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
        selected ? "bg-muted" : "hover:bg-muted/60"
      }`}
      title={selected ? "Remove" : "Add"}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

/* ============================== Component =============================== */
export default function HomeEditPage() {
  const { id: homeId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [home, setHome] = useState<LoadedHome | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lot unit for UI: default to ACRES
  const [lotUnit, setLotUnit] = useState<"acres" | "sqft">("acres");

  // Dismissed suggestions (per-home)
  const [dismissed, setDismissed] = useState<string[]>([]);

  // curated features (remove “Central Air”; add extras)
  const FEATURE_SUGGESTIONS = useMemo(() => {
    const base = RAW_FEATURE_SUGGESTIONS.filter(
      (f) => f.toLowerCase() !== "central air"
    );
    const extras = [
      "Fireplace",
      "EV Charger",
      "Irrigation System",
      "Solar Panels",
      "Whole-House Generator",
    ];
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

        // Map DB lotSize (sqft) → UI (acres)
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
        } catch {
          /* ignore */
        }
      } catch (e: any) {
        toast({
          title: "Load failed",
          description:
            e?.response?.data?.message || "Could not load this home.",
          variant: "destructive",
        });
        navigate("/homes");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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

      const unrec = data?.issues?.find?.(
        (i: any) => i?.code === "unrecognized_keys"
      );
      if (unrec?.keys?.length) {
        const cleaned = { ...payload };
        for (const k of unrec.keys) delete cleaned[k];
        try {
          await api.put(`/homes/${homeId}`, cleaned);
          toast({
            title: "Saved",
            description: "Home updated (after removing extra keys).",
          });
          setSaving(false);
          return;
        } catch {
          /* fall through to error toast below */
        }
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

  /* ------------------------ Template Room Helper ------------------------ */

  // When user changes architectural style, we can apply its template rooms.
  // We fetch current rooms on demand (so this page doesn’t own the rooms state).
  const fetchCurrentRooms = async (): Promise<
    { id: string; name?: string; type?: string }[]
  > => {
    const { data } = await api.get("/rooms", { params: { homeId } });
    return Array.isArray(data) ? data : [];
  };

  const createRoom = async (name: string, type: string, floor?: number) => {
    const payload = {
      homeId,
      name: name || "New Room",
      type: type || "Other",
      floor: typeof floor === "number" ? floor : 1,
    };
    await api.post("/rooms", payload);
  };

  const applyTemplateRooms = async (style: string) => {
    const template = (HOUSE_ROOM_TEMPLATES as any)?.[style] || [];
    const existing = await fetchCurrentRooms();
    const existingNames = new Set(
      existing.map((r) => (r.name || "").trim().toLowerCase())
    );
    for (const t of template) {
      if (!existingNames.has((t.name || "").trim().toLowerCase())) {
        // eslint-disable-next-line no-await-in-loop
        await createRoom(t.name, t.type, t.floor);
      }
    }
  };

  const handleStyleChange = async (nextStyle: string) => {
    if (!home) return;
    setHome({ ...home, architecturalStyle: nextStyle || null });

    const proceed =
      nextStyle &&
      window.confirm(
        "Add rooms from the selected style template? (Existing rooms are kept; duplicates are skipped.)"
      );
    if (!proceed || !nextStyle) return;

    await applyTemplateRooms(nextStyle);
    toast({
      title: "Template rooms added",
      description: `Applied template for ${nextStyle}.`,
    });
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

  const acceptSuggestion = (s: string) => {
    toggleCuratedFeature(s);
    toast({ title: "Added", description: `"${s}" added to features.` });
  };

  const dismissSuggestion = (s: string) => {
    const next = Array.from(new Set([...dismissed, s]));
    setDismissed(next);
    if (home?.id) {
      try {
        localStorage.setItem(dismissedKey(home.id), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
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
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Home</h1>
          <div className="space-x-2 flex items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!home.isChecked}
                onChange={(e) => setHome({ ...home, isChecked: e.target.checked })}
              />
              <span>Include in tasks</span>
            </label>
            <Button variant="outline" onClick={() => navigate("/app/homes")}>
              Back
            </Button>
            <Button onClick={saveAll} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {home ? renderAddressLine(home) : "No address on file"}
        </div>
      </div>

      {/* Photo + uploader + map */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-lg border p-3 space-y-3">
            <HomePhotoDropzone
              homeId={home.id}
              imageUrl={home.imageUrl || undefined}
              onUploaded={(abs) => {
                setHome({ ...home, imageUrl: abs });
                toast({ title: "Photo updated", description: "Main photo replaced." });
              }}
              className="aspect-[4/3] w-full rounded overflow-hidden bg-muted/40"
            />

            <MapboxAddress
              addressLine={fullAddress || ""}
              className="h-56 w-full rounded-lg border"
            />
          </div>
        </div>

        {/* Basics */}
        <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium mb-1">
              Nickname
            </label>
            <Input
              id="nickname"
              value={home.nickname || ""}
              onChange={(e) => setHome({ ...home, nickname: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="apartment" className="block text-sm font-medium mb-1">
              Apartment / Unit
            </label>
            <Input
              id="apartment"
              value={home.apartment || ""}
              onChange={(e) => setHome({ ...home, apartment: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="style" className="block text-sm font-medium mb-1">
              Architectural Style
            </label>
            <select
              id="style"
              value={home.architecturalStyle || ""}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
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
            <label htmlFor="yearBuilt" className="block text-sm font-medium mb-1">
              Year Built
            </label>
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
            <label htmlFor="squareFeet" className="block text-sm font-medium mb-1">
              Square Feet
            </label>
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
            <label htmlFor="lotSize" className="block text-sm font-medium mb-1">
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
                className="border rounded px-2 text-sm"
                value={lotUnit}
                onChange={(e) => {
                  const next = e.target.value as "acres" | "sqft";
                  if (
                    home.lotSize != null &&
                    !Number.isNaN(Number(home.lotSize))
                  ) {
                    const v = Number(home.lotSize);
                    const converted =
                      next === "sqft" ? Math.round(acresToSqft(v)) : sqftToAcres(v);
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
            <label className="block text-sm font-medium mb-1">Roof Type</label>
            <select
              value={home.roofType || ""}
              onChange={(e) =>
                setHome({ ...home, roofType: e.target.value || undefined })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {ROOF_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Siding Type</label>
            <select
              value={home.sidingType || ""}
              onChange={(e) =>
                setHome({ ...home, sidingType: e.target.value || undefined })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              {SIDING_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
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
                  onChange={(e) =>
                    setHome({ ...home, hasCentralAir: e.target.checked })
                  }
                />
                <span>Central Air</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!home.hasBaseboard}
                  onChange={(e) =>
                    setHome({ ...home, hasBaseboard: e.target.checked })
                  }
                />
                <span>Baseboard Heating</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!home.hasHeatPump}
                  onChange={(e) =>
                    setHome({ ...home, hasHeatPump: e.target.checked })
                  }
                />
                <span>Heat Pump</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Features</h2>

        {/* Selected features summary */}
        <div className="mb-3">
          <div className="text-sm font-medium mb-2">Selected</div>
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

        <div className="h-px bg-muted my-3" />

        {/* Curated list */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Quick add</div>
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
        <div className="mt-4 flex gap-2 items-center">
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
              const el = document.getElementById(
                "suggestFeature"
              ) as HTMLInputElement;
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

      {/* Rooms (floor-bucket UI lives inside RoomsPanel) */}
      <div className="mt-8 rounded-lg border p-4">
        <RoomsPanel homeId={home.id} />
      </div>
    </div>
  );
}
