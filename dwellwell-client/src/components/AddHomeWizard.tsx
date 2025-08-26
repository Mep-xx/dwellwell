import React from "react";
import { api } from "@/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ProgressBar } from "@/components/ui/progressbar";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/imageupload";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

// shared data (guarded to avoid .map() “String has no call signatures”)
import * as StyleModule from "@shared/architecturalStyleLabels";
import * as TemplatesModule from "@shared/houseRoomTemplates";
const styleList: string[] = Array.isArray((StyleModule as any).architecturalStyleLabels)
  ? ((StyleModule as any).architecturalStyleLabels as string[])
  : [];
const houseRoomTemplates: Record<string, { name?: string; type: string; floor?: number }[]> =
  (TemplatesModule as any).houseRoomTemplates || {};

type Suggestion = {
  id: string;
  place_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  apartment?: string;
};

type Home = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  apartment?: string | null;
  imageUrl?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (home: Home) => void;
  /** Back-compat alias your Homes.tsx used earlier */
  onFinished?: (home: Home) => void;
};

type FloorLabel =
  | "Basement"
  | "1st Floor"
  | "2nd Floor"
  | "3rd Floor"
  | "Attic"
  | "Other";

type RoomRow = {
  key: string;
  name: string;
  type: string;
  floorLabel: FloorLabel;
};

const steps = [
  { id: 0, name: "Address" },
  { id: 1, name: "Basics" },
  { id: 2, name: "Comfort & Exterior" },
  { id: 3, name: "Photo" },
];

const floorToLabel = (floor?: number | null): FloorLabel => {
  switch (floor) {
    case -1:
      return "Basement";
    case 1:
      return "1st Floor";
    case 2:
      return "2nd Floor";
    case 3:
      return "3rd Floor";
    case 99:
      return "Attic";
    case 0:
      return "Other";
    default:
      return "1st Floor";
  }
};
const labelToFloor = (label: FloorLabel): number => {
  switch (label) {
    case "Basement":
      return -1;
    case "1st Floor":
      return 1;
    case "2nd Floor":
      return 2;
    case "3rd Floor":
      return 3;
    case "Attic":
      return 99;
    case "Other":
      return 0;
    default:
      return 1;
  }
};

export default function AddHomeWizard({ open, onOpenChange, onCreated, onFinished }: Props) {
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aiNote, setAiNote] = React.useState<string | null>(null);

  const [home, setHome] = React.useState<Home | null>(null);

  // Address
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [selected, setSelected] = React.useState<Suggestion | null>(null);

  // Basics
  const [nickname, setNickname] = React.useState("");
  const [yearBuilt, setYearBuilt] = React.useState("");
  const [squareFeet, setSquareFeet] = React.useState("");
  const [lotSize, setLotSize] = React.useState("");
  const [architecturalStyle, setArchitecturalStyle] = React.useState("");
  const [apartment, setApartment] = React.useState("");
  const [rooms, setRooms] = React.useState<RoomRow[]>([]);

  // Comfort/exterior
  const [hasCentralAir, setHasCentralAir] = React.useState(false);
  const [hasBaseboard, setHasBaseboard] = React.useState(false);
  const [boilerType, setBoilerType] = React.useState("");
  const [roofType, setRoofType] = React.useState("");
  const [sidingType, setSidingType] = React.useState("");
  const [features, setFeatures] = React.useState("");

  // photo
  const [imageUrl, setImageUrl] = React.useState("");

  // suggest (Mapbox)
  React.useEffect(() => {
    let ignore = false;
    async function run() {
      if (!query || query.length < 3) {
        if (!ignore) setSuggestions([]);
        return;
      }
      try {
        const res = await api.get("/mapbox/suggest", { params: { q: query } });
        if (!ignore) setSuggestions(res.data || []);
      } catch {
        if (!ignore) setSuggestions([]);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [query]);

  function resetAll() {
    setStep(0);
    setLoading(false);
    setError(null);
    setAiNote(null);
    setHome(null);
    setQuery("");
    setSuggestions([]);
    setSelected(null);

    setNickname("");
    setYearBuilt("");
    setSquareFeet("");
    setLotSize("");
    setArchitecturalStyle("");
    setApartment("");
    setRooms([]);

    setHasCentralAir(false);
    setHasBaseboard(false);
    setBoilerType("");
    setRoofType("");
    setSidingType("");
    setFeatures("");
    setImageUrl("");
  }

  function close() {
    onOpenChange(false);
    setTimeout(resetAll, 200);
  }

  async function createMinimal() {
    if (!selected) {
      setError("Please select an address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        address: selected.address ?? selected.place_name,
        city: selected.city || "",
        state: selected.state || "",
        zip: selected.zip || "",
        apartment: selected.apartment || undefined,
      };
      const res = await api.post("/homes", payload);
      setHome(res.data);
      setStep(1);
      onCreated?.(res.data);
      onFinished?.(res.data); // back-compat (no-op for you now)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not create home.");
    } finally {
      setLoading(false);
    }
  }

  function applyStyleRooms(style: string) {
    const tpl = houseRoomTemplates[style];
    if (!tpl) return;
    const mapped: RoomRow[] = tpl.map((r, i) => ({
      key: `tpl-${i}-${r.type}`,
      name: r.name || "",
      type: r.type,
      floorLabel: floorToLabel(r.floor ?? 1),
    }));
    setRooms(mapped);
  }

  function handleStyleChange(next: string) {
    if (!next) {
      setArchitecturalStyle("");
      return;
    }
    const hasAnyRooms = rooms.length > 0;
    const canReplace =
      !hasAnyRooms ||
      window.confirm(
        "Changing the style will replace the current room list with the default template. Continue?"
      );
    setArchitecturalStyle(next);
    if (canReplace) applyStyleRooms(next);
  }

  async function saveBasicsAndNext() {
    if (!home) return;
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        nickname: nickname || undefined,
        yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
        squareFeet: squareFeet ? Number(squareFeet) : undefined,
        lotSize: lotSize ? Number(lotSize) : undefined,
        architecturalStyle: architecturalStyle || undefined,
        apartment: apartment || undefined,
        rooms: rooms.map((r) => ({
          name: r.name || "",
          type: r.type,
          floor: labelToFloor(r.floorLabel),
        })),
      };
      const res = await api.put(`/homes/${home.id}`, payload);
      setHome(res.data);
      setStep(2);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save basics.");
    } finally {
      setLoading(false);
    }
  }

  async function finishComfortAndNext() {
    if (!home) return;
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        hasCentralAir,
        hasBaseboard,
        boilerType: boilerType || undefined,
        roofType: roofType || undefined,
        sidingType: sidingType || undefined,
        features:
          features.trim().length > 0
            ? features.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
      };
      const res = await api.put(`/homes/${home.id}`, payload);
      setHome(res.data);
      setStep(3);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save details.");
    } finally {
      setLoading(false);
    }
  }

  async function runEnhance() {
    if (!home) return;
    setAiNote(null);
    setError(null);
    try {
      const res = await api.post(`/homes/${home.id}/enrich`, {
        hints: {
          address: `${home.address}, ${home.city}, ${home.state} ${home.zip}`,
          style: architecturalStyle || undefined,
          sqft: squareFeet ? Number(squareFeet) : undefined,
        },
      });
      const patch = res.data?.patch || {};

      let touched = 0;
      const applyString = (val: any, setter: (s: string) => void) => {
        if (typeof val === "string" && val.trim() !== "") {
          setter(val);
          touched++;
        }
      };
      const applyNumStr = (val: any, setter: (s: string) => void) => {
        if (typeof val === "number" && !Number.isNaN(val)) {
          setter(String(val));
          touched++;
        }
      };
      const applyBool = (val: any, setter: (b: boolean) => void) => {
        if (typeof val === "boolean") {
          setter(val);
          touched++;
        }
      };

      applyString(patch.nickname, setNickname);
      applyString(patch.apartment, setApartment);
      applyNumStr(patch.squareFeet, setSquareFeet);
      applyNumStr(patch.lotSize, setLotSize);
      applyNumStr(patch.yearBuilt, setYearBuilt);

      if (typeof patch.architecturalStyle === "string") {
        handleStyleChange(patch.architecturalStyle);
        touched++;
      }
      applyBool(patch.hasCentralAir, setHasCentralAir);
      applyBool(patch.hasBaseboard, setHasBaseboard);
      applyString(patch.boilerType, setBoilerType);
      applyString(patch.roofType, setRoofType);
      applyString(patch.sidingType, setSidingType);

      if (Array.isArray(patch.features)) {
        setFeatures(patch.features.join(", "));
        touched++;
      }
      if (Array.isArray(patch.rooms)) {
        const mapped: RoomRow[] = patch.rooms.map((r: any, i: number) => ({
          key: `ai-${i}-${r.type || "Room"}`,
          name: r.name || "",
          type: r.type || "Room",
          floorLabel: floorToLabel(typeof r.floor === "number" ? r.floor : 1),
        }));
        setRooms(mapped);
        touched++;
      }

      setAiNote(
        touched > 0
          ? `✨ Enhanced: updated ${touched} field${touched === 1 ? "" : "s"} (not yet saved).`
          : "✨ Enhanced: no changes detected."
      );
    } catch (e: any) {
      console.error("Enhance failed", e);
      setError(e?.response?.data?.message || "AI enhance failed.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setStep(0) : close())}>
      <DialogContent aria-describedby="add-home-desc">
        <DialogHeader>
          <DialogTitle>Add a Home</DialogTitle>
          <DialogDescription id="add-home-desc">
            We’ll start with the address, then a few optional details you can always fill in later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ProgressBar currentStep={step} steps={steps.map((s) => s.name)} />
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "rounded-md px-2 py-1 text-sm",
                  i === step ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {i + 1}. {s.name}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 p-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {aiNote && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
              {aiNote}
            </div>
          )}

          {/* STEP 0: ADDRESS */}
          {step === 0 && (
            <div className="space-y-3">
              <Label htmlFor="address">Search address</Label>
              <Input
                id="address"
                placeholder="Start typing your address…"
                value={query}
                onChange={(e) => {
                  setSelected(null);
                  setQuery(e.target.value);
                }}
                autoFocus
              />
              {suggestions.length > 0 && (
                <div className="max-h-44 overflow-auto rounded-md border">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-accent",
                        selected?.id === s.id && "bg-accent"
                      )}
                      onClick={() => {
                        setSelected(s);
                        setQuery(s.place_name);
                        setSuggestions([]);
                      }}
                      type="button"
                    >
                      {s.place_name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={close}>
                  Cancel
                </Button>
                <Button onClick={createMinimal} disabled={loading}>
                  {loading ? "Creating…" : "Use this address"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: BASICS */}
          {step === 1 && home && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="apartment">Apt / Unit (optional)</Label>
                  <Input
                    id="apartment"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="yearBuilt">Year built (optional)</Label>
                  <Input
                    id="yearBuilt"
                    inputMode="numeric"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g., 1998"
                  />
                </div>
                <div>
                  <Label htmlFor="squareFeet">Square feet (optional)</Label>
                  <Input
                    id="squareFeet"
                    inputMode="numeric"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g., 2200"
                  />
                </div>
                <div>
                  <Label htmlFor="lotSize">Lot size (acres, optional)</Label>
                  <Input
                    id="lotSize"
                    inputMode="decimal"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g., 0.25"
                  />
                </div>
                <div>
                  <Label htmlFor="style">Architectural style</Label>
                  <Select
                    id="style"
                    value={architecturalStyle}
                    onChange={(e) => handleStyleChange(e.target.value)}
                  >
                    <option value="">Select style</option>
                    {styleList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Changing style replaces the room list with the style’s defaults.
                  </p>
                </div>
              </div>

              {/* quick inline room list */}
              <div className="space-y-2">
                <Label>Rooms</Label>
                {rooms.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    No rooms yet. Choose a style to auto-populate, or add your own.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {rooms.map((r, idx) => (
                      <div
                        key={r.key}
                        className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-12"
                      >
                        <div className="md:col-span-5">
                          <Input
                            placeholder="Name"
                            value={r.name}
                            onChange={(e) =>
                              setRooms((prev) => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], name: e.target.value };
                                return copy;
                              })
                            }
                          />
                        </div>
                        <div className="md:col-span-5">
                          <Input
                            placeholder="Type"
                            value={r.type}
                            onChange={(e) =>
                              setRooms((prev) => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], type: e.target.value };
                                return copy;
                              })
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Select
                            value={r.floorLabel}
                            onChange={(e) =>
                              setRooms((prev) => {
                                const copy = [...prev];
                                copy[idx] = {
                                  ...copy[idx],
                                  floorLabel: e.target.value as FloorLabel,
                                };
                                return copy;
                              })
                            }
                          >
                            {[
                              "Basement",
                              "1st Floor",
                              "2nd Floor",
                              "3rd Floor",
                              "Attic",
                              "Other",
                            ].map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(0)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={runEnhance} title="Enhance with AI">
                    <Wand2 className="mr-2 h-4 w-4" /> Enhance with AI
                  </Button>
                  <Button onClick={saveBasicsAndNext} disabled={loading}>
                    {loading ? "Saving…" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COMFORT & EXTERIOR */}
          {step === 2 && home && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">Central Air</div>
                    <div className="text-sm text-muted-foreground">
                      Does the home have central A/C?
                    </div>
                  </div>
                  <Switch checked={hasCentralAir} onCheckedChange={setHasCentralAir} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">Baseboard Heating</div>
                    <div className="text-sm text-muted-foreground">
                      Hydronic baseboards present?
                    </div>
                  </div>
                  <Switch checked={hasBaseboard} onCheckedChange={setHasBaseboard} />
                </div>

                <div>
                  <Label>Boiler / Furnace (optional)</Label>
                  <Select
                    value={boilerType}
                    onChange={(e) => setBoilerType(e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option value="Gas-Fired">Gas-Fired</option>
                    <option value="Oil-Fired">Oil-Fired</option>
                    <option value="Electric">Electric</option>
                    <option value="None">None</option>
                  </Select>
                </div>

                <div>
                  <Label>Roof (optional)</Label>
                  <Select value={roofType} onChange={(e) => setRoofType(e.target.value)}>
                    <option value="">Select roof type</option>
                    <option value="Asphalt Shingle">Asphalt Shingle</option>
                    <option value="Metal">Metal</option>
                    <option value="Tile">Tile</option>
                    <option value="Slate">Slate</option>
                  </Select>
                </div>

                <div>
                  <Label>Siding (optional)</Label>
                  <Select
                    value={sidingType}
                    onChange={(e) => setSidingType(e.target.value)}
                  >
                    <option value="">Select siding type</option>
                    <option value="Vinyl">Vinyl</option>
                    <option value="Wood">Wood</option>
                    <option value="Fiber Cement">Fiber Cement</option>
                    <option value="Brick">Brick</option>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Features (comma-separated, optional)</Label>
                  <Textarea
                    placeholder="e.g., Fireplace, Finished Basement, Solar Panels"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Skip
                  </Button>
                  <Button onClick={finishComfortAndNext} disabled={loading}>
                    {loading ? "Saving…" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTO */}
          {step === 3 && home && (
            <div className="space-y-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Home"
                  className="h-48 w-full rounded-md object-cover"
                />
              )}
              <ImageUpload
                homeId={home.id}
                onUploadComplete={(url) => {
                  setImageUrl(url);
                }}
              />
              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    close();
                  }}
                >
                  Finish
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
