// src/pages/HomeEditPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import ImageUpload from "@/components/ui/imageupload";

import type { Home } from "@shared/types/home";
import type { Room } from "@shared/types/room";

/** ---------- Constants ---------- */
const STYLE_OPTIONS = [
  "Colonial","Cape","Ranch","Contemporary","Tudor","Victorian",
  "Craftsman","Farmhouse","Split-Level","Townhouse","Condo","Multi-Family","Other",
];

const ROOM_TYPES = [
  "Bedroom","Bathroom","Kitchen","Living Room","Dining Room","Office",
  "Laundry","Garage","Basement","Attic","Hallway","Closet","Other",
] as const;

const DEFAULT_ROOMS_BY_STYLE: Record<
  string,
  Array<{ name: string; type: string; floor?: number }>
> = {
  Colonial: [
    { name: "Primary Bedroom", type: "Bedroom", floor: 2 },
    { name: "Bedroom 2", type: "Bedroom", floor: 2 },
    { name: "Bedroom 3", type: "Bedroom", floor: 2 },
    { name: "Full Bath", type: "Bathroom", floor: 2 },
    { name: "Kitchen", type: "Kitchen", floor: 1 },
    { name: "Living Room", type: "Living Room", floor: 1 },
    { name: "Dining Room", type: "Dining Room", floor: 1 },
    { name: "Half Bath", type: "Bathroom", floor: 1 },
    { name: "Laundry", type: "Laundry", floor: 1 },
  ],
  Ranch: [
    { name: "Primary Bedroom", type: "Bedroom", floor: 1 },
    { name: "Bedroom 2", type: "Bedroom", floor: 1 },
    { name: "Bedroom 3", type: "Bedroom", floor: 1 },
    { name: "Full Bath", type: "Bathroom", floor: 1 },
    { name: "Kitchen", type: "Kitchen", floor: 1 },
    { name: "Living Room", type: "Living Room", floor: 1 },
    { name: "Dining Area", type: "Dining Room", floor: 1 },
  ],
  Cape: [
    { name: "Primary Bedroom", type: "Bedroom", floor: 2 },
    { name: "Bedroom 2", type: "Bedroom", floor: 2 },
    { name: "Full Bath", type: "Bathroom", floor: 2 },
    { name: "Kitchen", type: "Kitchen", floor: 1 },
    { name: "Living Room", type: "Living Room", floor: 1 },
    { name: "Dining Room", type: "Dining Room", floor: 1 },
  ],
  Other: [
    { name: "Primary Bedroom", type: "Bedroom", floor: 1 },
    { name: "Full Bath", type: "Bathroom", floor: 1 },
    { name: "Kitchen", type: "Kitchen", floor: 1 },
    { name: "Living Room", type: "Living Room", floor: 1 },
  ],
};

// Building details dropdowns
const BOILER_TYPES = ["None","Steam","Hot Water","Combi","Electric","Forced Air Furnace","Heat Pump","Other"];
const ROOF_TYPES   = ["Asphalt Shingle","Metal","Tile","Slate","Wood Shake","Rubber (EPDM)","TPO","Other"];
const SIDING_TYPES = ["Vinyl","Wood","Fiber Cement","Brick","Stone","Stucco","Aluminum","Other"];

// Feature suggestions
const FEATURE_SUGGESTIONS = [
  "Fireplace","Hardwood Floors","Fenced Yard","Deck/Patio","Central Air",
  "Finished Basement","Walk-In Closet","Granite Counters","Stainless Appliances",
  "Solar Panels","Irrigation System","Skylight","Mudroom","Workshop","EV Charger",
];

/** ---------- Types ---------- */
type LoadedHome = Home & {
  rooms?: Room[];
  features?: string[] | null;
  imageUrl?: string | null;
  boilerType?: string | null;
  roofType?: string | null;
  sidingType?: string | null;
  hasCentralAir?: boolean | null;
  hasBaseboard?: boolean | null;
};

/** ---------- Helpers ---------- */
const isUUIDish = (v: unknown) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const diffSummary = (before: any, after: any): string[] => {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const normalize = (val: any) => (Array.isArray(val) ? JSON.stringify(val) : val ?? null);
  const out: string[] = [];
  keys.forEach((k) => {
    if (normalize(before?.[k]) !== normalize(after?.[k])) {
      out.push(`${k}: ${before?.[k] ?? "—"} → ${after?.[k] ?? "—"}`);
    }
  });
  return out;
};

/** =============================
 *             Page
 *  ============================= */
export default function HomeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [home, setHome] = useState<LoadedHome | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [features, setFeatures] = useState<string[]>([]);

  const [boilerType, setBoilerType] = useState<string>("");
  const [roofType, setRoofType] = useState<string>("");
  const [sidingType, setSidingType] = useState<string>("");

  const prevStyleRef = useRef<string | null>(null);

  // Load once
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/homes/${id}`);
        const h = res.data as LoadedHome;

        setHome(h);
        setRooms((h.rooms ?? []).map((r) => ({ ...r })));
        setFeatures(Array.isArray(h.features) ? h.features : []);
        setBoilerType(h.boilerType ?? "");
        setRoofType(h.roofType ?? "");
        setSidingType(h.sidingType ?? "");

        // Track the style we loaded with
        prevStyleRef.current = h.architecturalStyle ?? null;
      } catch (e) {
        console.error("Failed to load home", e);
        toast({ title: "Error", description: "Could not load home.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Apply default room template whenever the current style is non-empty & changed,
  // including the first selection (when prev was null).
  useEffect(() => {
    if (!home) return;
    const current = home.architecturalStyle || "";
    const prev = prevStyleRef.current;

    if (current && current !== prev) {
      const tmpl = DEFAULT_ROOMS_BY_STYLE[current] || DEFAULT_ROOMS_BY_STYLE.Other;
      const mapped: Room[] = tmpl.map((t, i) => ({
        id: `tmp-${Date.now()}-${i}`,
        homeId: home.id!,
        name: t.name,
        type: t.type,
        floor: t.floor ?? 1,
      })) as any;

      setRooms(mapped);
      toast({
        title: "Default rooms applied",
        description: `Loaded ${mapped.length} rooms for ${current}.`,
      });
    }
    prevStyleRef.current = current;
  }, [home?.architecturalStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Rooms CRUD (client side) */
  const addRoom = () => {
    if (!home) return;
    setRooms((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        homeId: home.id!,
        name: `Room ${prev.length + 1}`,
        type: "Other",
        floor: 1,
      } as any,
    ]);
  };
  const updateRoom = (rid: string, patch: Partial<Room>) =>
    setRooms((prev) => prev.map((r) => (String(r.id) === String(rid) ? { ...r, ...patch } : r)));
  const removeRoom = (rid: string) =>
    setRooms((prev) => prev.filter((r) => String(r.id) !== String(rid)));

  /** Features (chips + suggestions) */
  const [featureInput, setFeatureInput] = useState("");
  const addFeature = (f: string) => {
    const val = f.trim();
    if (!val) return;
    setFeatures((prev) => (prev.includes(val) ? prev : [...prev, val]));
    setFeatureInput("");
  };
  const removeFeature = (f: string) => setFeatures((prev) => prev.filter((x) => x !== f));
  const filteredSuggestions = useMemo(
    () =>
      FEATURE_SUGGESTIONS.filter(
        (s) =>
          s.toLowerCase().includes(featureInput.toLowerCase()) &&
          !features.some((f) => f.toLowerCase() === s.toLowerCase())
      ).slice(0, 8),
    [featureInput, features]
  );

  const onImageUploaded = (url: string) => {
    setHome((p) => (p ? { ...p, imageUrl: url } : p));
  };

  /** Save */
  const save = async () => {
    if (!home || !id) return;

    try {
      const before = {
        nickname: home.nickname ?? null,
        apartment: home.apartment ?? null,
        architecturalStyle: home.architecturalStyle ?? null,
        squareFeet: home.squareFeet ?? null,
        lotSize: home.lotSize ?? null,
        yearBuilt: home.yearBuilt ?? null,
        hasCentralAir: !!home.hasCentralAir,
        hasBaseboard: !!home.hasBaseboard,
        boilerType,
        roofType,
        sidingType,
        features,
        roomsCount: rooms.length,
      };

      // Only send UUID ids; tmp-* means "create new"
      const cleanRooms = rooms.map((r) => {
        const base = {
          name: r.name,
          type: r.type,
          floor: typeof r.floor === "number" ? r.floor : 1,
        };
        return isUUIDish(r.id) ? { id: r.id, ...base } : base;
      });

      // Build payload with only API-allowed keys (no imageUrl — that’s handled by the upload route)
      const payload: any = {
        nickname: home.nickname ?? null,
        apartment: home.apartment ?? null,
        architecturalStyle: home.architecturalStyle ?? null,
        squareFeet: home.squareFeet ?? null,
        lotSize: home.lotSize ?? null,
        yearBuilt: home.yearBuilt ?? null,
        hasCentralAir: !!home.hasCentralAir,
        hasBaseboard: !!home.hasBaseboard,
        boilerType: boilerType || null,
        roofType: roofType || null,
        sidingType: sidingType || null,
        features,
        rooms: cleanRooms,
      };

      await api.put(`/homes/${id}`, payload);

      // Re-fetch to reflect server state precisely
      const refreshed = (await api.get(`/homes/${id}`)).data as LoadedHome;
      setHome(refreshed);
      setRooms((refreshed.rooms ?? []).map((r) => ({ ...r })));
      setFeatures(Array.isArray(refreshed.features) ? refreshed.features : []);
      setBoilerType(refreshed.boilerType ?? "");
      setRoofType(refreshed.roofType ?? "");
      setSidingType(refreshed.sidingType ?? "");

      const after = {
        ...before,
        roomsCount: (refreshed.rooms ?? []).length,
        boilerType: refreshed.boilerType ?? "",
        roofType: refreshed.roofType ?? "",
        sidingType: refreshed.sidingType ?? "",
      };
      const changes = diffSummary(before, after);

      toast({
        title: "Saved",
        description:
          changes.length > 0
            ? `Updated ${changes.length} field${changes.length === 1 ? "" : "s"}:\n• ${changes.join("\n• ")}`
            : "No changes detected.",
        variant: "success",
      });
    } catch (err: any) {
      const apiErr = err?.response?.data;
      console.error("Save failed", apiErr || err);
      const details = Array.isArray(apiErr?.issues)
        ? "\n\nIssues:\n• " + apiErr.issues.map((i: any) => i.message ?? JSON.stringify(i)).join("\n• ")
        : "";
      toast({
        title: "Save failed",
        description:
          (apiErr?.message as string) ||
          "The server rejected the update. Please review required fields." + details,
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!home)
    return (
      <div className="p-6">
        <p className="text-red-600">Home not found.</p>
        <Button className="mt-4" onClick={() => navigate("/homes")}>
          Back to Homes
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Home</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/homes")}>
            Back
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>

      {/* Photo + Basics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-lg border p-3">
            <ImageUpload homeId={home.id!} onUploadComplete={onImageUploaded} />
            {home.imageUrl ? (
              <img
                src={home.imageUrl}
                alt="Home"
                className="mt-3 aspect-[4/3] w-full rounded object-cover"
              />
            ) : (
              <div className="mt-3 aspect-[4/3] w-full rounded bg-muted/40" />
            )}
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={home.nickname ?? ""}
              onChange={(e) => setHome((p) => (p ? { ...p, nickname: e.target.value } : p))}
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="apartment">Apartment / Unit</Label>
            <Input
              id="apartment"
              value={home.apartment ?? ""}
              onChange={(e) => setHome((p) => (p ? { ...p, apartment: e.target.value } : p))}
              autoComplete="off"
            />
          </div>

          <div>
            <Label>Architectural Style</Label>
            <Select
              value={home.architecturalStyle ?? ""}
              onChange={(e) =>
                setHome((p) => (p ? { ...p, architecturalStyle: e.target.value || null } : p))
              }
            >
              <option value="">(Select style)</option>
              {STYLE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              type="number"
              value={home.yearBuilt ?? ""}
              onChange={(e) =>
                setHome((p) =>
                  p ? { ...p, yearBuilt: e.target.value ? Number(e.target.value) : null } : p
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="squareFeet">Square Feet</Label>
            <Input
              id="squareFeet"
              type="number"
              value={home.squareFeet ?? ""}
              onChange={(e) =>
                setHome((p) =>
                  p ? { ...p, squareFeet: e.target.value ? Number(e.target.value) : null } : p
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="lotSize">Lot Size (sqft)</Label>
            <Input
              id="lotSize"
              type="number"
              value={home.lotSize ?? ""}
              onChange={(e) =>
                setHome((p) => (p ? { ...p, lotSize: e.target.value ? Number(e.target.value) : null } : p))
              }
            />
          </div>
        </div>
      </div>

      {/* Building Details */}
      <div className="mt-8 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Building Details</h2>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Boiler / HVAC</Label>
            <Select value={boilerType} onChange={(e) => setBoilerType(e.target.value)}>
              <option value="">(Select…)</option>
              {BOILER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Roof Type</Label>
            <Select value={roofType} onChange={(e) => setRoofType(e.target.value)}>
              <option value="">(Select…)</option>
              {ROOF_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Siding Type</Label>
            <Select value={sidingType} onChange={(e) => setSidingType(e.target.value)}>
              <option value="">(Select…)</option>
              {SIDING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!home.hasCentralAir}
              onChange={(e) =>
                setHome((p) => (p ? { ...p, hasCentralAir: e.target.checked } : p))
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
                setHome((p) => (p ? { ...p, hasBaseboard: e.target.checked } : p))
              }
            />
            <span>Baseboard Heating</span>
          </label>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Features</h2>
        <div className="mt-1 flex flex-wrap gap-2">
          {features.map((f) => (
            <span
              key={f}
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
            >
              {f}
              <button
                type="button"
                className="ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => removeFeature(f)}
                aria-label={`Remove ${f}`}
                title={`Remove ${f}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            placeholder="Type a feature and press Add"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature(featureInput);
              }
            }}
          />
          <Button type="button" variant="outline" onClick={() => addFeature(featureInput)}>
            Add
          </Button>
        </div>
        {filteredSuggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                onClick={() => addFeature(s)}
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rooms */}
      <div className="mt-8 rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <Button variant="outline" onClick={addRoom}>
            Add Room
          </Button>
        </div>

        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms yet.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Floor</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={String(r.id)} className="border-b">
                    <td className="py-2 pr-4">
                      <Input
                        value={r.name ?? ""}
                        onChange={(e) => updateRoom(String(r.id), { name: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <Select
                        value={r.type ?? "Other"}
                        onChange={(e) => updateRoom(String(r.id), { type: e.target.value })}
                      >
                        {ROOM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-2 pr-4">
                      <Input
                        type="number"
                        value={typeof r.floor === "number" ? r.floor : 1}
                        onChange={(e) =>
                          updateRoom(String(r.id), { floor: Number(e.target.value || 1) })
                        }
                      />
                    </td>
                    <td className="py-2">
                      <Button variant="ghost" onClick={() => removeRoom(String(r.id))}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
