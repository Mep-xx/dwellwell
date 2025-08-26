// src/components/AddHomeWizard.tsx
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
import { Select } from "@/components/ui/select"; // simple styled <select>
import { Switch } from "@/components/ui/switch";
import { ProgressBar } from "@/components/ui/progressbar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ImageUpload from "@/components/ui/imageupload";

// style dropdown
import { architecturalStyleLabels } from "@shared/architecturalStyleLabels";

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
  nickname?: string | null;
  architecturalStyle?: string | null;
  squareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (home: Home) => void;
  onFinished?: (home: Home) => void; // 👈 used to redirect after final step
};

const steps = [
  { id: 0, name: "Address" },
  { id: 1, name: "Basics" },
  { id: 2, name: "Comfort & Exterior" },
  { id: 3, name: "Photo" },
];

function normalizeLabels(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((v): v is string => typeof v === "string");
  if (input && typeof input === "object") {
    // Accept shapes like { Colonial: 'Colonial', Ranch: 'Ranch' } or { labels: [...] }
    // @ts-ignore probing
    if (Array.isArray(input.labels)) return input.labels.filter((v: unknown): v is string => typeof v === "string");
    return Object.values(input).filter((v): v is string => typeof v === "string");
  }
  return [];
}
const styleOptions = normalizeLabels(architecturalStyleLabels);

export default function AddHomeWizard({ open, onOpenChange, onCreated, onFinished }: Props) {
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // created home after step 0
  const [home, setHome] = React.useState<Home | null>(null);

  // Step 0: address search/selection
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [selected, setSelected] = React.useState<Suggestion | null>(null);

  // Step 1: basics
  const [nickname, setNickname] = React.useState("");
  const [yearBuilt, setYearBuilt] = React.useState<string>("");
  const [squareFeet, setSquareFeet] = React.useState<string>("");
  const [lotSize, setLotSize] = React.useState<string>("");
  const [architecturalStyle, setArchitecturalStyle] = React.useState("");
  const [apartment, setApartment] = React.useState("");

  // Step 2: comfort/exterior
  const [hasCentralAir, setHasCentralAir] = React.useState(false);
  const [hasBaseboard, setHasBaseboard] = React.useState(false);
  const [boilerType, setBoilerType] = React.useState<string>("");
  const [roofType, setRoofType] = React.useState<string>("");
  const [sidingType, setSidingType] = React.useState<string>("");
  const [features, setFeatures] = React.useState<string>(""); // comma-separated
  const [heatingCoolingTypes, setHeatingCoolingTypes] = React.useState<string[]>([]);

  // Step 3: photo
  const [imageUrl, setImageUrl] = React.useState<string>("");

  // address suggestions (avoid re-fetch if a suggestion is selected)
  React.useEffect(() => {
    let ignore = false;
    async function run() {
      if (!query || query.length < 3 || selected) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await api.get("/mapbox/suggest", { params: { q: query } }); // server accepts q OR query
        if (!ignore) setSuggestions(res.data || []);
      } catch {
        if (!ignore) setSuggestions([]);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [query, selected]);

  function resetAll() {
    setStep(0);
    setLoading(false);
    setError(null);
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

    setHasCentralAir(false);
    setHasBaseboard(false);
    setBoilerType("");
    setRoofType("");
    setSidingType("");
    setFeatures("");
    setHeatingCoolingTypes([]);

    setImageUrl("");
  }

  function close() {
    onOpenChange(false);
    // Give the dialog a moment to close before clearing
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
      const created: Home = res.data;
      setHome(created);
      setStep(1);
      onCreated?.(created);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not create home.");
    } finally {
      setLoading(false);
    }
  }

  async function enhanceWithAI() {
    if (!home) return;
    try {
      setLoading(true);
      const res = await api.post(`/homes/${home.id}/enrich`);
      const s = res.data || {};
      if (s.yearBuilt && !yearBuilt) setYearBuilt(String(s.yearBuilt));
      if (s.roofType && !roofType) setRoofType(s.roofType);
      if (s.sidingType && !sidingType) setSidingType(s.sidingType);
      if (Array.isArray(s.heatingCoolingTypes) && heatingCoolingTypes.length === 0) {
        setHeatingCoolingTypes(s.heatingCoolingTypes);
      }
      if (Array.isArray(s.features) && !features) {
        setFeatures(s.features.join(", "));
      }
    } catch (e) {
      console.error("Enhance failed", e);
      setError("We couldn’t auto-fill details right now.");
    } finally {
      setLoading(false);
    }
  }

  async function saveBasicsAndNext() {
    if (!home) return;
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        nickname: nickname || undefined,
        apartment: apartment || undefined,
        yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
        squareFeet: squareFeet ? Number(squareFeet) : undefined,
        lotSize: lotSize ? Number(lotSize) : undefined,
        architecturalStyle: architecturalStyle || undefined,
        // include booleans to satisfy stricter parsers
        hasCentralAir,
        hasBaseboard,
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

  async function saveComfortAndNext() {
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
        heatingCoolingTypes: heatingCoolingTypes.length ? heatingCoolingTypes : undefined,
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

  async function finishWizard() {
    if (!home) return;
    // optional final sync (imageUrl already saved by upload step)
    onFinished?.(home);
    close();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (o ? setStep(0) : close())}
    >
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
                        setSuggestions([]); // prevent re-open flash
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
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g., Current Home"
                  />
                </div>
                <div>
                  <Label htmlFor="apartment">Apt / Unit (optional)</Label>
                  <Input
                    id="apartment"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="e.g., Unit 3B"
                  />
                </div>
                <div>
                  <Label htmlFor="yearBuilt">Year built (optional)</Label>
                  <Input
                    inputMode="numeric"
                    id="yearBuilt"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt((e.target.value ?? "").replace(/\D/g, ""))}
                    placeholder="e.g., 1997"
                  />
                </div>
                <div>
                  <Label htmlFor="squareFeet">Square feet (optional)</Label>
                  <Input
                    inputMode="numeric"
                    id="squareFeet"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet((e.target.value ?? "").replace(/\D/g, ""))}
                    placeholder="e.g., 2500"
                  />
                </div>
                <div>
                  <Label htmlFor="lotSize">Lot size (acres, optional)</Label>
                  <Input
                    inputMode="decimal"
                    id="lotSize"
                    value={lotSize}
                    onChange={(e) => setLotSize((e.target.value ?? "").replace(/[^0-9.]/g, ""))}
                    placeholder="e.g., 0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="style">Architectural style (optional)</Label>
                  <Select
                    id="style"
                    value={architecturalStyle}
                    onChange={(e) => setArchitecturalStyle(e.target.value)}
                    aria-label="Architectural Style"
                  >
                    <option value="">Select style</option>
                    {styleOptions.map((lbl) => (
                      <option key={lbl} value={lbl}>
                        {lbl}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(0)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Skip
                  </Button>
                  <Button onClick={saveBasicsAndNext} disabled={loading}>
                    {loading ? "Saving…" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COMFORT & EXTERIOR */}
          {step === 2 && (
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
                    aria-label="Boiler or Furnace Type"
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
                  <Select
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value)}
                    aria-label="Roof Type"
                  >
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
                    aria-label="Siding Type"
                  >
                    <option value="">Select siding type</option>
                    <option value="Vinyl">Vinyl</option>
                    <option value="Wood">Wood</option>
                    <option value="Fiber Cement">Fiber Cement</option>
                    <option value="Brick">Brick</option>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Heating/Cooling systems (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Central Air",
                      "Baseboard Heating",
                      "Boiler (Radiators)",
                      "Forced Hot Air",
                      "Heat Pump",
                      "Radiant Heating",
                      "Ductless Mini-Split",
                      "Pellet Stove",
                      "Space Heater",
                      "Solar Heating",
                    ].map((option) => {
                      const checked = heatingCoolingTypes.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          className={cn(
                            "rounded border px-3 py-1 text-sm",
                            checked ? "bg-primary text-primary-foreground" : "bg-gray-100 hover:bg-gray-200"
                          )}
                          onClick={() =>
                            setHeatingCoolingTypes((prev) =>
                              prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
                            )
                          }
                        >
                          {checked ? "✓ " : ""}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>Features (comma-separated, optional)</Label>
                  <Textarea
                    placeholder="e.g., Fireplace, Finished Basement, Solar Panels"
                    value={features}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeatures(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={enhanceWithAI} disabled={loading}>
                    {loading ? "Enhancing…" : "Enhance with AI"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Skip
                  </Button>
                  <Button onClick={saveComfortAndNext} disabled={loading}>
                    {loading ? "Saving…" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTO */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Photo (optional)</Label>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Home"
                    className="mt-2 max-h-56 w-full rounded border object-cover"
                  />
                ) : (
                  <div className="mt-2 rounded border p-3 text-sm text-muted-foreground">No photo yet.</div>
                )}
              </div>

              <ImageUpload
                homeId={home!.id}
                onUploadComplete={async (absoluteUrl) => {
                  setImageUrl(absoluteUrl); // show immediately
                  try {
                    await api.put(`/homes/${home!.id}`, { imageUrl: absoluteUrl });
                  } catch (e) {
                    console.warn("Could not persist imageUrl on home", e);
                  }
                }}
              />

              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => finishWizard()}>
                    Skip
                  </Button>
                  <Button onClick={() => finishWizard()} disabled={loading}>
                    Finish
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
