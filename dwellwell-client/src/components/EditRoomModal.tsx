// dwellwell-client/src/components/EditRoomModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";
import type { Room } from "@shared/types/room";
import { useToast } from "@/components/ui/use-toast";
import { RoomTypeSelect } from "@/components/RoomTypeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  FLOORING_TYPES,
  WALL_FINISHES,
  CEILING_TYPES,
  WINDOW_TYPES,
  CEILING_FIXTURES,
  sortByLabel,
} from "@shared/constants/roomOptions";

/* -------------------- floor helpers (local) -------------------- */

type FloorKey = -1 | 0 | 1 | 2 | 3 | 99;
const FLOOR_LABELS: Record<FloorKey, string> = {
  [-1]: "Basement",
  0: "Other",
  1: "1st Floor",
  2: "2nd Floor",
  3: "3rd Floor",
  99: "Attic",
};
const LABEL_TO_FLOOR: Record<string, FloorKey> = {
  Basement: -1,
  "1st Floor": 1,
  "2nd Floor": 2,
  "3rd Floor": 3,
  Attic: 99,
  Other: 0,
};
function floorNumberToLabel(floor?: number | null): string {
  if (floor == null) return "";
  return (FLOOR_LABELS as Record<number, string>)[floor] ?? "";
}
function floorLabelToNumber(label: string): number | null {
  return label in LABEL_TO_FLOOR ? LABEL_TO_FLOOR[label] : null;
}

/* -------------------- types -------------------- */

type Props = {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

type RoomTask = { id: string; title: string; disabled: boolean };
type NullableInt = number | "";

/* -------------------- helpers -------------------- */

function toIntOrNull(v: NullableInt): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function nonEmpty<T>(v: T | "" | undefined | null): T | null {
  return v === "" || v === undefined || v === null ? null : (v as T);
}

/* -------------------- component -------------------- */

export function EditRoomModal({ room, isOpen, onClose, onSave }: Props) {
  const { toast } = useToast();

  // Basic
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [floorLabel, setFloorLabel] = useState("");

  // Surfaces
  const [flooring, setFlooring] = useState<string>("");
  const [wallFinish, setWallFinish] = useState<string>("");
  const [ceilingType, setCeilingType] = useState<string>("");

  // Openings
  const [windowCount, setWindowCount] = useState<NullableInt>("");
  const [windowType, setWindowType] = useState<string>("none");
  const [hasExteriorDoor, setHasExteriorDoor] = useState(false);

  // Heating & cooling
  const [heatBaseHydronic, setHeatBaseHydronic] = useState(false);
  const [heatBaseElectric, setHeatBaseElectric] = useState(false);
  const [heatRadiator, setHeatRadiator] = useState(false);
  const [hvacSupplyVents, setHvacSupplyVents] = useState<NullableInt>("");
  const [hvacReturnVents, setHvacReturnVents] = useState<NullableInt>("");
  const [hasCeilingFan, setHasCeilingFan] = useState(false);
  const [ceilingFixture, setCeilingFixture] = useState<string>("none");
  const [recessedLightCount, setRecessedLightCount] = useState<NullableInt>("");
  const [hasFireplace, setHasFireplace] = useState(false); // 🔥 moved here

  // Electrical
  const [approxOutletCount, setApproxOutletCount] = useState<NullableInt>("");
  const [hasGfci, setHasGfci] = useState(false);

  // Safety
  const [hasSmokeDetector, setHasSmokeDetector] = useState(false);
  const [hasCoDetector, setHasCoDetector] = useState(false);

  // Plumbing
  const [sinkCount, setSinkCount] = useState<NullableInt>("");
  const [toiletCount, setToiletCount] = useState<NullableInt>("");
  const [showerCount, setShowerCount] = useState<NullableInt>("");
  const [tubCount, setTubCount] = useState<NullableInt>("");
  const [hasRadiantFloorHeat, setHasRadiantFloorHeat] = useState(false);

  // Access / misc
  const [hasAtticAccess, setHasAtticAccess] = useState(false);
  const [hasCrawlspaceAccess, setHasCrawlspaceAccess] = useState(false);

  // Tasks & misc
  const [userTasks, setUserTasks] = useState<RoomTask[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Advanced toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Keep a flag to avoid setting snapshot before tasks load (internal only)
  const firstLoadRef = useRef(true);

  // Pre-sorted option sets for consistent UX
  const flooringOpts       = useMemo(() => sortByLabel(FLOORING_TYPES), []);
  const wallFinishOpts     = useMemo(() => sortByLabel(WALL_FINISHES), []);
  const ceilingTypeOpts    = useMemo(() => sortByLabel(CEILING_TYPES), []);
  const windowTypeOpts     = useMemo(() => sortByLabel(WINDOW_TYPES), []);
  const ceilingFixtureOpts = useMemo(() => sortByLabel(CEILING_FIXTURES), []);

  // load current room + details into local state on open
  useEffect(() => {
    if (!isOpen || !room) return;

    setName(room.name ?? "");
    setType(room.type ?? "");
    setFloorLabel(floorNumberToLabel(room.floor ?? null));

    (async () => {
      setLoadingTasks(true);
      try {
        // Pull the room including detail (we can reuse list for simplicity)
        const { data } = await api.get(`/rooms`, {
          params: { homeId: (room as any).homeId, includeDetails: true },
        });
        const full = Array.isArray(data)
          ? (data as any[]).find((r: any) => r.id === room.id)
          : data;

        const d = full?.detail ?? {};

        // Surfaces
        setFlooring(d.flooring ?? "");
        setWallFinish(d.wallFinish ?? "");
        setCeilingType(d.ceilingType ?? "");

        // Openings
        setWindowCount(typeof d.windowCount === "number" ? d.windowCount : "");
        setWindowType(d.windowType ?? "none");
        setHasExteriorDoor(Boolean(d.hasExteriorDoor));

        // HVAC
        setHeatBaseHydronic(Boolean(d.heatBaseboardHydronic));
        setHeatBaseElectric(Boolean(d.heatBaseboardElectric));
        setHeatRadiator(Boolean(d.heatRadiator));
        setHvacSupplyVents(
          typeof d.hvacSupplyVents === "number" ? d.hvacSupplyVents : ""
        );
        setHvacReturnVents(
          typeof d.hvacReturnVents === "number" ? d.hvacReturnVents : ""
        );
        setHasCeilingFan(Boolean(d.hasCeilingFan));
        setCeilingFixture(d.ceilingFixture ?? "none");
        setRecessedLightCount(
          typeof d.recessedLightCount === "number" ? d.recessedLightCount : ""
        );
        setHasFireplace(Boolean(d.hasFireplace)); // 🔥

        // Electrical
        setApproxOutletCount(
          typeof d.approxOutletCount === "number" ? d.approxOutletCount : ""
        );
        setHasGfci(Boolean(d.hasGfci));

        // Safety
        setHasSmokeDetector(Boolean(d.hasSmokeDetector));
        setHasCoDetector(Boolean(d.hasCoDetector));

        // Plumbing
        setSinkCount(typeof d.sinkCount === "number" ? d.sinkCount : "");
        setToiletCount(typeof d.toiletCount === "number" ? d.toiletCount : "");
        setShowerCount(typeof d.showerCount === "number" ? d.showerCount : "");
        setTubCount(typeof d.tubCount === "number" ? d.tubCount : "");
        setHasRadiantFloorHeat(Boolean(d.hasRadiantFloorHeat));

        // Access
        setHasAtticAccess(Boolean(d.hasAtticAccess));
        setHasCrawlspaceAccess(Boolean(d.hasCrawlspaceAccess));

        // Tasks (unchanged)
        try {
          const t = await api.get(`/rooms/${room.id}/tasks`);
          setUserTasks(Array.isArray(t.data) ? t.data : []);
        } catch {
          setUserTasks([]);
        }
      } catch (err) {
        console.error("Failed to load room detail or tasks", err);
        toast({ title: "Failed to load room", variant: "destructive" });
      } finally {
        setLoadingTasks(false);
        firstLoadRef.current = false;
      }
    })();
  }, [isOpen, room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const floorOptions = useMemo(
    () =>
      ["Basement", "1st Floor", "2nd Floor", "3rd Floor", "Attic", "Other"] as const,
    []
  );

  const toggleTask = (taskId: string) => {
    setUserTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, disabled: !t.disabled } : t))
    );
  };

  const handleSubmit = async () => {
    if (!room?.id) return;
    setSaving(true);
    try {
      await api.put(`/rooms/${room.id}`, {
        name,
        type,
        floor: floorLabelToNumber(floorLabel),
        details: {
          // Surfaces
          flooring: nonEmpty<string>(flooring),
          wallFinish: nonEmpty<string>(wallFinish),
          ceilingType: nonEmpty<string>(ceilingType),

          // Openings
          windowCount: toIntOrNull(windowCount),
          windowType: nonEmpty<string>(windowType),
          hasExteriorDoor,

          // Heating & cooling
          heatBaseboardHydronic: heatBaseHydronic,
          heatBaseboardElectric: heatBaseElectric,
          heatRadiator,
          hvacSupplyVents: toIntOrNull(hvacSupplyVents),
          hvacReturnVents: toIntOrNull(hvacReturnVents),
          hasCeilingFan,
          ceilingFixture: nonEmpty<string>(ceilingFixture),
          recessedLightCount: toIntOrNull(recessedLightCount),
          hasFireplace, // 🔥 moved into this block

          // Electrical
          approxOutletCount: toIntOrNull(approxOutletCount),
          hasGfci,

          // Safety (detectors only)
          hasSmokeDetector,
          hasCoDetector,

          // Plumbing
          sinkCount: toIntOrNull(sinkCount),
          toiletCount: toIntOrNull(toiletCount),
          showerCount: toIntOrNull(showerCount),
          tubCount: toIntOrNull(tubCount),
          hasRadiantFloorHeat,

          // Access
          hasAtticAccess,
          hasCrawlspaceAccess,
        },
      });

      if (userTasks.length) {
        const disabledTaskIds = userTasks.filter((t) => t.disabled).map((t) => t.id);
        await api.put(`/rooms/${room.id}/tasks`, { disabledTaskIds });
      }

      onSave();
      onClose();
      toast({ title: "Room updated" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error updating room", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const titleText =
    (name?.trim() ? `Edit: ${name.trim()}` :
      type?.trim() ? `Edit: ${type.trim()}` :
        "Edit Room");

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-primary flex items-center gap-2">
            🛠️ {titleText}
          </DialogTitle>
          <DialogDescription>
            Update the room’s details and features. This helps DwellWell generate better reminders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Basics */}
          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Nickname (optional)</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Primary Bathroom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Room Type</label>
              <RoomTypeSelect value={type} onChange={setType} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Floor</label>
              <select
                value={floorLabel}
                onChange={(e) => setFloorLabel(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select Floor</option>
                {floorOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Surfaces */}
          <section className="rounded-lg border p-4 bg-amber-50/40">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🪵 Surfaces</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-1">Flooring</label>
                <select
                  value={flooring}
                  onChange={(e) => setFlooring(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">(Select)</option>
                  {flooringOpts.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Wall Finish</label>
                <select
                  value={wallFinish}
                  onChange={(e) => setWallFinish(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">(Select)</option>
                  {wallFinishOpts.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ceiling Type</label>
                <select
                  value={ceilingType}
                  onChange={(e) => setCeilingType(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">(Select)</option>
                  {ceilingTypeOpts.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Openings */}
          <section className="rounded-lg border p-4 bg-sky-50/40">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🪟 Openings</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-1">Windows</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={windowCount}
                  onChange={(e) =>
                    setWindowCount(
                      e.target.value === ""
                        ? ""
                        : (Math.max(0, Number(e.target.value)) as number)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Window Type</label>
                <select
                  value={windowType}
                  onChange={(e) => setWindowType(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {windowTypeOpts.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium mb-1">Exterior Door</span>
                  <span className="text-xs text-muted-foreground">
                    Direct outside access
                  </span>
                </div>
                <Switch
                  checked={hasExteriorDoor}
                  onCheckedChange={setHasExteriorDoor}
                  aria-label="Exterior Door"
                />
              </div>
            </div>
          </section>

          {/* Heating & Cooling (now includes Fireplace) */}
          <section className="rounded-lg border p-4 bg-rose-50/40">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🌡️ Heating & Cooling</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Baseboard (Hydronic)</span>
                <Switch
                  checked={heatBaseHydronic}
                  onCheckedChange={setHeatBaseHydronic}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Baseboard (Electric)</span>
                <Switch
                  checked={heatBaseElectric}
                  onCheckedChange={setHeatBaseElectric}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Radiator</span>
                <Switch checked={heatRadiator} onCheckedChange={setHeatRadiator} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  HVAC Supply Vents
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={hvacSupplyVents}
                  onChange={(e) =>
                    setHvacSupplyVents(
                      e.target.value === ""
                        ? ""
                        : (Math.max(0, Number(e.target.value)) as number)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  HVAC Return Vents
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={hvacReturnVents}
                  onChange={(e) =>
                    setHvacReturnVents(
                      e.target.value === ""
                        ? ""
                        : (Math.max(0, Number(e.target.value)) as number)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ceiling Fan</span>
                <Switch
                  checked={hasCeilingFan}
                  onCheckedChange={setHasCeilingFan}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ceiling Fixture</label>
                <select
                  value={ceilingFixture}
                  onChange={(e) => setCeilingFixture(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {ceilingFixtureOpts.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fireplace moved here */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Fireplace</span>
                <Switch checked={hasFireplace} onCheckedChange={setHasFireplace} />
              </div>
            </div>
          </section>

          {/* Safety (detectors only) */}
          <section className="rounded-lg border p-4 bg-emerald-50/40">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🛡️ Safety</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Smoke Detector</span>
                <Switch
                  checked={hasSmokeDetector}
                  onCheckedChange={setHasSmokeDetector}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CO Detector</span>
                <Switch checked={hasCoDetector} onCheckedChange={setHasCoDetector} />
              </div>
            </div>
          </section>

          {/* Plumbing (if applicable) */}
          <section className="rounded-lg border p-4 bg-cyan-50/40">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🚿 Plumbing</h4>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sinks</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={sinkCount}
                  onChange={(e) =>
                    setSinkCount(
                      e.target.value === ""
                        ? ""
                        : (Math.max(0, Number(e.target.value)) as number)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Toilets</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={toiletCount}
                  onChange={(e) =>
                    setToiletCount(
                      e.target.value === ""
                        ? ""
                        : (Math.max(0, Number(e.target.value)) as number)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Showers</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={showerCount}
                  onChange={(e) =>
                    setShowerCount(
                      e.target.value === ""
                        ? ""
                        : (Math.max(0, Number(e.target.value)) as number)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tubs</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={tubCount}
                  onChange={(e) =>
                    setTubCount(
                      e.target.value === ""
                        ? ""
                        : (Math.max(0, Number(e.target.value)) as number)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between md:col-span-4">
                <span className="text-sm">Radiant Floor Heating</span>
                <Switch
                  checked={hasRadiantFloorHeat}
                  onCheckedChange={setHasRadiantFloorHeat}
                />
              </div>
            </div>
          </section>

          {/* Advanced details (collapsed by default) */}
          <section className="rounded-lg border">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              aria-expanded={showAdvanced}
              aria-controls="room-advanced"
            >
              <span className="font-semibold flex items-center gap-2">⚙️ Advanced details</span>
              <span className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {showAdvanced && (
              <div id="room-advanced" className="p-4 space-y-4 bg-white/60 rounded-b-lg">
                {/* Lighting details */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Recessed Lights
                    </label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={recessedLightCount}
                      onChange={(e) =>
                        setRecessedLightCount(
                          e.target.value === ""
                            ? ""
                            : (Math.max(0, Number(e.target.value)) as number)
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                  {/* Electrical detail */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Approx. Outlets
                    </label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={approxOutletCount}
                      onChange={(e) =>
                        setApproxOutletCount(
                          e.target.value === ""
                            ? ""
                            : (Math.max(0, Number(e.target.value)) as number)
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Access */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Attic Access</span>
                    <Switch
                      checked={hasAtticAccess}
                      onCheckedChange={setHasAtticAccess}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Crawlspace Access</span>
                    <Switch
                      checked={hasCrawlspaceAccess}
                      onCheckedChange={setHasCrawlspaceAccess}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Tracked Tasks (unchanged) */}
          <section className="rounded-lg border p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">📋 Tracked Tasks</h4>
            <div className="border rounded p-2 max-h-48 overflow-y-auto space-y-2 bg-white/60">
              {loadingTasks ? (
                <p className="text-xs text-muted-foreground italic">Loading…</p>
              ) : userTasks.length ? (
                userTasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!task.disabled}
                      onChange={() => toggleTask(task.id)}
                    />
                    {task.title}
                  </label>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No tasks assigned to this room.
                </p>
              )}
            </div>
          </section>
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
