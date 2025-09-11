// dwellwell-client/src/pages/Room.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  BedDouble,
  Bath,
  Sofa,
  Refrigerator,
  DoorOpen,
  Warehouse,
} from "lucide-react";
import { useRoomAutosave } from "@/hooks/useRoomAutosave";

/* ============================== Types =============================== */
type Room = {
  id: string;
  homeId: string;
  name?: string | null;
  type?: string | null;
  floor?: number | null;
  detail?: RoomDetail | null;
};

type RoomDetail = {
  flooring?: string | null;
  wallFinish?: string | null;
  ceilingType?: string | null;
  windowType?: string | null;
  windowCount?: number | null;
  hasExteriorDoor?: boolean | null;

  heatBaseboardHydronic?: boolean | null;
  heatBaseboardElectric?: boolean | null;
  heatRadiator?: boolean | null;
  hvacSupplyVents?: number | null;
  hvacReturnVents?: number | null;

  hasCeilingFan?: boolean | null;
  ceilingFixture?: string | null;
  recessedLightCount?: number | null;

  approxOutletCount?: number | null;
  hasGfci?: boolean | null;

  hasSmokeDetector?: boolean | null;
  hasCoDetector?: boolean | null;
  hasFireplace?: boolean | null;

  sinkCount?: number | null;
  toiletCount?: number | null;
  showerCount?: number | null;
  tubCount?: number | null;
  hasRadiantFloorHeat?: boolean | null;

  hasAtticAccess?: boolean | null;
  hasCrawlspaceAccess?: boolean | null;
  attributes?: Record<string, any> | null;
};

type Trackable = {
  id: string;
  name?: string;
  type?: string | null;
  kind?: string | null;
  userDefinedName?: string | null;
  roomId?: string | null;
  homeId?: string;
};

/* ============================== Icon banner =============================== */

const ROOM_META: Record<
  string,
  { label: string; Icon: React.FC<any>; gradient: string; examples: string[] }
> = {
  kitchen: {
    label: "Kitchen",
    Icon: Refrigerator,
    gradient: "from-emerald-200 via-emerald-100 to-white",
    examples: ["Refrigerator", "Dishwasher", "Range", "Microwave", "Hood", "Disposal"],
  },
  bathroom: {
    label: "Bathroom",
    Icon: Bath,
    gradient: "from-sky-200 via-sky-100 to-white",
    examples: ["Exhaust Fan", "GFCI", "Shower", "Sink"],
  },
  bedroom: {
    label: "Bedroom",
    Icon: BedDouble,
    gradient: "from-violet-200 via-violet-100 to-white",
    examples: ["Ceiling Fan", "Smoke Detector"],
  },
  living: {
    label: "Living Room",
    Icon: Sofa,
    gradient: "from-amber-200 via-amber-100 to-white",
    examples: ["Fireplace", "Smoke Detector"],
  },
  entry: {
    label: "Entry",
    Icon: DoorOpen,
    gradient: "from-rose-200 via-rose-100 to-white",
    examples: ["GFCI", "Doorbell"],
  },
  other: {
    label: "Room",
    Icon: Warehouse,
    gradient: "from-slate-200 via-slate-100 to-white",
    examples: [],
  },
};

function metaFor(type?: string | null) {
  const key = (type || "").toLowerCase();
  if (key.includes("kitchen")) return ROOM_META.kitchen;
  if (key.includes("bath")) return ROOM_META.bathroom;
  if (key.includes("bed")) return ROOM_META.bedroom;
  if (key.includes("living") || key.includes("family")) return ROOM_META.living;
  if (key.includes("entry") || key.includes("foyer")) return ROOM_META.entry;
  return ROOM_META.other;
}

/* ============================== Page =============================== */

export default function RoomPage() {
  const params = useParams<{ id?: string; roomId?: string }>();
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { toast } = useToast();

  // If router param name doesn't match, fall back to parsing the URL.
  const rawFromUrl = useMemo(() => {
    const m = window.location.pathname.match(/\/rooms\/([^\/?#]+)/i);
    return m?.[1];
  }, [location.pathname]);

  const preloaded: Room | null = location?.state?.room ?? null;
  const roomId: string | undefined =
    params.roomId ?? params.id ?? preloaded?.id ?? rawFromUrl;

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(preloaded ?? null);
  const [trackables, setTrackables] = useState<Trackable[]>([]);

  // add-trackable form
  const addRef = useRef<HTMLInputElement | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");

  /* ------------------------------- Autosave ------------------------------- */
  const { saving: autosaveStatus, savedPulse, scheduleSave } = useRoomAutosave(roomId);

  /* ------------------------------- Load ------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (import.meta.env.DEV) {
        console.log("[RoomPage] roomId (from params/url/state):", roomId);
      }

      // If we truly have no id, stop loading and show error UI.
      if (!roomId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // If we don’t already have it (no preloaded), fetch room
        if (!preloaded) {
          try {
            const { data } = await api.get(`/rooms/${roomId}`, {
              params: { includeDetails: true },
            });
            if (!cancelled) setRoom(data);
            if (import.meta.env.DEV) {
              console.log("[RoomPage] GET /rooms/%s OK", roomId, data);
            }
          } catch (err: any) {
            if (import.meta.env.DEV) {
              console.error("[RoomPage] GET /rooms/%s failed", roomId, err);
            }
            if (!cancelled) {
              toast({
                title: "We couldn’t open this room.",
                description: "Missing room or you don’t have access.",
                variant: "destructive",
              });
              // Keep us on the page so user sees the error state instead of silent redirect.
              setRoom(null);
            }
            return;
          }
        }

        // Load trackables (best-effort)
        try {
          const { data: t } = await api.get(`/trackables`, {
            params: { roomId },
          });
          if (!cancelled) setTrackables(Array.isArray(t) ? t : []);
        } catch {
          /* optional: ignore */
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [roomId, preloaded, toast]);

  useEffect(() => {
    if (window.location.hash === "#add-trackable") {
      setTimeout(() => addRef.current?.focus(), 0);
    }
  }, []);

  const title = useMemo(
    () => (room?.name?.trim() ? room.name!.trim() : room?.type || "Room"),
    [room]
  );
  const meta = metaFor(room?.type);

  /* ----------------------------- Trackables ---------------------------- */

  const addTrackable = async () => {
    if (!room || !newName.trim()) return;

    const base = { homeId: room.homeId, roomId: room.id };

    // 1) New shape
    try {
      const { data } = await api.post(`/trackables`, {
        ...base,
        userDefinedName: newName.trim(),
        kind: newType || null,
      });
      setTrackables((t) => [data, ...t]);
      setNewName("");
      setNewType("");
      return;
    } catch {
      /* fall back */
    }
    // 2) Legacy shape
    try {
      const { data } = await api.post(`/trackables`, {
        ...base,
        name: newName.trim(),
        type: newType || null,
      });
      setTrackables((t) => [data, ...t]);
      setNewName("");
      setNewType("");
    } catch {
      toast({
        title: "Add failed",
        description: "Couldn’t create trackable.",
        variant: "destructive",
      });
    }
  };

  const removeTrackable = async (id: string) => {
    const prev = trackables;
    setTrackables((t) => t.filter((x) => x.id !== id));
    try {
      await api.delete(`/trackables/${id}`);
    } catch {
      setTrackables(prev);
      toast({
        title: "Delete failed",
        description: "Couldn’t delete trackable.",
        variant: "destructive",
      });
    }
  };

  /* ------------------------------- UI -------------------------------- */

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading room…</div>
      </div>
    );
  }

  // Error / missing id or not found
  if (!room) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="rounded-lg border p-4">
          <h1 className="text-xl font-semibold mb-1">We couldn’t open this room.</h1>
          <p className="text-sm text-muted-foreground">
            {roomId
              ? "It may not exist or you don’t have access."
              : "Missing room id in the URL."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => navigate("/app/homes")}>Back to Homes</Button>
          </div>
          <pre className="mt-4 rounded bg-muted p-2 text-xs overflow-auto">
{`debug:
  pathname: ${window.location.pathname}
  roomId: ${roomId ?? "(none)"}
`}
          </pre>
        </div>
      </div>
    );
  }

  const savingBadge =
    autosaveStatus === "saving"
      ? "Saving…"
      : autosaveStatus === "error"
      ? "⚠ Save failed"
      : autosaveStatus === "ok"
      ? "✓ Saved"
      : "";

  return (
    <div className="p-6 max-w-6xl">
      {/* Banner */}
      <div
        className={[
          "relative overflow-hidden rounded-xl border mb-4",
          "bg-gradient-to-br",
          meta.gradient,
          savedPulse ? "ring-2 ring-emerald-400/60 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" : "ring-0",
          autosaveStatus === "saving" ? "animate-pulse" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <meta.Icon className="h-8 w-8 opacity-80" />
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {room.name?.trim() || room.type || "Room"}
              </h1>
              <div className="text-xs text-slate-600">
                {room.type || "Room"} · {room.floor ? `Floor ${room.floor}` : "No floor set"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savingBadge ? (
              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
                  autosaveStatus === "error"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : autosaveStatus === "saving"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200",
                ].join(" ")}
              >
                {savingBadge}
              </span>
            ) : null}

            <Button variant="outline" onClick={() => navigate(`/app/homes/${room.homeId}?tab=rooms`)}>
              Back to Rooms
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left — Trackables & Tasks */}
        <div className="md:col-span-2 space-y-4">
          {/* Trackables */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="font-semibold">Trackables</div>
              {meta.examples.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Suggested for a {meta.label}: {meta.examples.join(" · ")}
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
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
                <div className="mt-3 text-sm text-muted-foreground">No trackables yet.</div>
              ) : (
                <ul className="mt-3 divide-y rounded border">
                  {trackables.map((t) => {
                    const display = t.userDefinedName || t.name || "(Unnamed)";
                    const subtype = t.kind || t.type || "";
                    return (
                      <li key={t.id} className="flex items-center justify-between p-3">
                        <div>
                          <div className="font-medium">{display}</div>
                          {subtype ? (
                            <div className="text-xs text-muted-foreground">{subtype}</div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => removeTrackable(t.id)}>
                            Delete
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-lg border">
            <div className="px-4 py-2 border-b font-semibold">Tasks</div>
            <div className="p-4 text-sm text-muted-foreground">No tasks yet for this room.</div>
          </div>
        </div>

        {/* Right — Details */}
        <div className="space-y-4">
          {/* Basics */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Basics</div>

            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input
              value={room.name || ""}
              onChange={(e) => {
                const val = e.target.value;
                setRoom({ ...room, name: val });
                scheduleSave({ name: val });
              }}
              placeholder="e.g., Primary Bathroom"
              className="mb-3"
            />

            <label className="mb-1 block text-sm font-medium">Type</label>
            <Input
              value={room.type || ""}
              onChange={(e) => {
                const val = e.target.value;
                setRoom({ ...room, type: val });
                scheduleSave({ type: val });
              }}
              placeholder="e.g., Bathroom"
              className="mb-3"
            />

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

          {/* Surfaces */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Surfaces</div>

            <label className="mb-1 block text-sm font-medium">Flooring</label>
            <select
              value={room.detail?.flooring || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setRoom((r) => ({ ...(r as Room), detail: { ...(r?.detail || {}), flooring: v } }));
                scheduleSave({ details: { flooring: v } });
              }}
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              <option value="carpet">Carpet</option>
              <option value="hardwood">Hardwood</option>
              <option value="laminate">Laminate</option>
              <option value="tile">Tile</option>
              <option value="vinyl">Vinyl</option>
              <option value="stone">Stone</option>
              <option value="concrete">Concrete</option>
              <option value="other">Other</option>
            </select>

            <label className="mb-1 block text-sm font-medium">Walls</label>
            <select
              value={room.detail?.wallFinish || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setRoom((r) => ({ ...(r as Room), detail: { ...(r?.detail || {}), wallFinish: v } }));
                scheduleSave({ details: { wallFinish: v } });
              }}
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              <option value="painted_drywall">Painted Drywall</option>
              <option value="wallpaper">Wallpaper</option>
              <option value="wood_paneling">Wood Paneling</option>
              <option value="plaster">Plaster</option>
              <option value="other">Other</option>
            </select>

            <label className="mb-1 block text-sm font-medium">Ceiling</label>
            <select
              value={room.detail?.ceilingType || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setRoom((r) => ({ ...(r as Room), detail: { ...(r?.detail || {}), ceilingType: v } }));
                scheduleSave({ details: { ceilingType: v } });
              }}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              <option value="drywall">Drywall</option>
              <option value="drop_ceiling">Drop Ceiling</option>
              <option value="exposed_beams">Exposed Beams</option>
              <option value="skylight">Skylight</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Openings */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Openings</div>

            <label className="mb-1 block text-sm font-medium">Windows</label>
            <select
              value={room.detail?.windowType || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setRoom((r) => ({ ...(r as Room), detail: { ...(r?.detail || {}), windowType: v } }));
                scheduleSave({ details: { windowType: v } });
              }}
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              <option value="none">None</option>
              <option value="single_hung">Single-Hung</option>
              <option value="double_hung">Double-Hung</option>
              <option value="casement">Casement</option>
              <option value="awning">Awning</option>
              <option value="bay">Bay</option>
              <option value="slider">Slider</option>
              <option value="fixed">Fixed</option>
              <option value="skylight">Skylight</option>
              <option value="other">Other</option>
            </select>

            <label className="mb-1 block text-sm font-medium">Window Count</label>
            <Input
              type="number"
              inputMode="numeric"
              value={room.detail?.windowCount ?? 0}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : 0;
                setRoom((r) => ({ ...(r as Room), detail: { ...(r?.detail || {}), windowCount: v } }));
                scheduleSave({ details: { windowCount: v } });
              }}
              className="mb-3"
            />

            <label className="mb-1 block text-sm font-medium">Exterior Door</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!room.detail?.hasExteriorDoor}
                onChange={(e) => {
                  const v = e.target.checked;
                  setRoom((r) => ({ ...(r as Room), detail: { ...(r?.detail || {}), hasExteriorDoor: v } }));
                  scheduleSave({ details: { hasExteriorDoor: v } });
                }}
              />
              <span className="text-sm text-muted-foreground">Has exterior door</span>
            </div>
          </div>

          {/* Heating & Cooling */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-semibold">Heating & Cooling</div>

            {[
              ["Baseboard (hydronic)", "heatBaseboardHydronic"],
              ["Baseboard (electric)", "heatBaseboardElectric"],
              ["Radiators", "heatRadiator"],
            ].map(([label, key]) => (
              <label key={key} className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!(room.detail as any)?.[key]}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setRoom((r) => ({
                      ...(r as Room),
                      detail: { ...(r?.detail || {}), [key]: v } as any,
                    }));
                    scheduleSave({ details: { [key]: v } as any });
                  }}
                />
                <span>{label}</span>
              </label>
            ))}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="mb-1 block text-sm font-medium">HVAC Supply Vents</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={room.detail?.hvacSupplyVents ?? 0}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : 0;
                    setRoom((r) => ({
                      ...(r as Room),
                      detail: { ...(r?.detail || {}), hvacSupplyVents: v },
                    }));
                    scheduleSave({ details: { hvacSupplyVents: v } });
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">HVAC Return Vents</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={room.detail?.hvacReturnVents ?? 0}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : 0;
                    setRoom((r) => ({
                      ...(r as Room),
                      detail: { ...(r?.detail || {}), hvacReturnVents: v },
                    }));
                    scheduleSave({ details: { hvacReturnVents: v } });
                  }}
                />
              </div>
            </div>

            <label className="mt-3 mb-1 block text-sm font-medium">Ceiling Fixture</label>
            <select
              value={room.detail?.ceilingFixture || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setRoom((r) => ({
                  ...(r as Room),
                  detail: { ...(r?.detail || {}), ceilingFixture: v },
                }));
                scheduleSave({ details: { ceilingFixture: v } });
              }}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">(Select…)</option>
              <option value="none">None</option>
              <option value="flushmount">Flushmount</option>
              <option value="chandelier">Chandelier</option>
              <option value="fan_only">Fan Only</option>
              <option value="fan_with_light">Fan + Light</option>
              <option value="recessed">Recessed</option>
              <option value="track">Track</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
