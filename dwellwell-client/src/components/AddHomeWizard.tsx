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
import { Select } from "@/components/ui/select"; // simple select
import { Switch } from "@/components/ui/switch";
import { ProgressBar } from "@/components/ui/progressbar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AddressAutocomplete, AddressSuggestion } from "@/components/AddressAutocomplete";
import { architecturalStyleLabels } from '@shared/architecturalStyleLabels';
import { houseRoomTemplates } from '@shared/houseRoomTemplates';
import { ImageUpload } from '@/components/ui/imageupload';

type Suggestion = AddressSuggestion;

type Home = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  apartment?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (home: Home) => void;
};

const steps = [
  { id: 0, name: "Address" },
  { id: 1, name: "Basics" },
  { id: 2, name: "Comfort & Exterior" },
  { id: 3, name: "Photo (optional)" },
];

export default function AddHomeWizard({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [enhancing, setEnhancing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // created home id after step 0
  const [home, setHome] = React.useState<Home | null>(null);

  // Step 0: address selection
  const [selected, setSelected] = React.useState<Suggestion | null>(null);

  // Step 1: basics
  const [nickname, setNickname] = React.useState("");
  const [yearBuilt, setYearBuilt] = React.useState<string>("");
  const [squareFeet, setSquareFeet] = React.useState<string>("");
  const [lotSize, setLotSize] = React.useState<string>("");
  const [architecturalStyle, setArchitecturalStyle] = React.useState("");
  const [numberOfRooms, setNumberOfRooms] = React.useState<string>("");
  const [apartment, setApartment] = React.useState("");

  // Step 2: comfort/exterior
  const [hasCentralAir, setHasCentralAir] = React.useState(false);
  const [hasBaseboard, setHasBaseboard] = React.useState(false);
  const [boilerType, setBoilerType] = React.useState<string>("");
  const [roofType, setRoofType] = React.useState<string>("");
  const [sidingType, setSidingType] = React.useState<string>("");
  const [features, setFeatures] = React.useState<string>(""); // comma-separated

  function resetAll() {
    setStep(0);
    setLoading(false);
    setEnhancing(false);
    setError(null);
    setHome(null);
    setSelected(null);
    setNickname("");
    setYearBuilt("");
    setSquareFeet("");
    setLotSize("");
    setArchitecturalStyle("");
    setNumberOfRooms("");
    setApartment("");
    setHasCentralAir(false);
    setHasBaseboard(false);
    setBoilerType("");
    setRoofType("");
    setSidingType("");
    setFeatures("");
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
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not create home.");
    } finally {
      setLoading(false);
    }
  }

  const handleEnhance = async () => {
    if (!home) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/homes/${home.id}/enrich`);
      const e = res.data as Partial<{
        nickname: string;
        yearBuilt: number;
        squareFeet: number;
        lotSize: number;
        architecturalStyle: string;
        numberOfRooms: number;
        apartment: string;

        hasCentralAir: boolean;
        hasBaseboard: boolean;
        boilerType: string;
        roofType: string;
        sidingType: string;
        features: string[];
      }>;

      if (e.nickname) setNickname(e.nickname);
      if (e.yearBuilt) setYearBuilt(String(e.yearBuilt));
      if (e.squareFeet) setSquareFeet(String(e.squareFeet));
      if (e.lotSize) setLotSize(String(e.lotSize));
      if (e.architecturalStyle) setArchitecturalStyle(e.architecturalStyle);
      if (e.numberOfRooms) setNumberOfRooms(String(e.numberOfRooms));
      if (typeof e.apartment === "string") setApartment(e.apartment);

      if (typeof e.hasCentralAir === "boolean") setHasCentralAir(e.hasCentralAir);
      if (typeof e.hasBaseboard === "boolean") setHasBaseboard(e.hasBaseboard);
      if (e.boilerType) setBoilerType(e.boilerType);
      if (e.roofType) setRoofType(e.roofType);
      if (e.sidingType) setSidingType(e.sidingType);
      if (Array.isArray(e.features)) setFeatures(e.features.join(", "));
    } catch {
      setError("Enhanced lookup is unavailable. You can continue manually.");
    } finally {
      setLoading(false);
    }
  };

  function formatSelectedDisplay(s: Suggestion | null) {
    if (!s) return "";
    const parts = [
      s.address ?? s.place_name,
      s.city,
      s.state,
      s.zip,
    ].filter(Boolean);
    return parts.join(", ");
  }

  const saveBasicsAndNext = React.useCallback(async () => {
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
        numberOfRooms: numberOfRooms ? Number(numberOfRooms) : undefined,
        apartment: apartment || undefined,
      };
      const res = await api.put(`/homes/${home.id}`, payload);
      setHome(res.data);
      setStep(2);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save basics.");
    } finally {
      setLoading(false);
    }
  }, [home, nickname, yearBuilt, squareFeet, lotSize, architecturalStyle, numberOfRooms, apartment]);

  const saveComfortAndNext = React.useCallback(async () => {
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
      setStep(3); // 👈 go to Photo step
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save details.");
    } finally {
      setLoading(false);
    }
  }, [home, hasCentralAir, hasBaseboard, boilerType, roofType, sidingType, features]);

  const finish = React.useCallback(async () => {
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
      close();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save details.");
    } finally {
      setLoading(false);
    }
  }, [home, hasCentralAir, hasBaseboard, boilerType, roofType, sidingType, features]);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setStep(0) : close())}>
      {/* limit width so it doesn't span full viewport */}
      <DialogContent className="w-full sm:max-w-2xl" aria-describedby="add-home-desc">
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
              <Label htmlFor="address-ac">Search address</Label>
              <AddressAutocomplete
                displayValue={formatSelectedDisplay(selected)}
                onSelectSuggestion={(s) => setSelected(s)}
                onClear={() => setSelected(null)}
              />

              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={close}>Cancel</Button>
                <Button onClick={createMinimal} disabled={loading || !selected}>
                  {loading ? 'Creating…' : 'Use this address'}
                </Button>
              </div>
            </div>
          )}


          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!home) return;
                    setLoading(true); setError(null);
                    try {
                      const res = await api.post(`/homes/${home.id}/enrich`, {
                        address: home.address, city: home.city, state: home.state, zip: home.zip,
                        current: {
                          yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
                          squareFeet: squareFeet ? Number(squareFeet) : undefined,
                          lotSize: lotSize ? Number(lotSize) : undefined,
                          numberOfRooms: numberOfRooms ? Number(numberOfRooms) : undefined,
                          hasCentralAir, hasBaseboard, boilerType, roofType, sidingType,
                          architecturalStyle: architecturalStyle || undefined,
                          features: features ? features.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                        },
                      });
                      const d = res.data?.data || {};
                      if (d.yearBuilt) setYearBuilt(String(d.yearBuilt));
                      if (d.squareFeet) setSquareFeet(String(d.squareFeet));
                      if (d.lotSize) setLotSize(String(d.lotSize));
                      if (d.numberOfRooms) setNumberOfRooms(String(d.numberOfRooms));
                      if (typeof d.hasCentralAir === 'boolean') setHasCentralAir(d.hasCentralAir);
                      if (typeof d.hasBaseboard === 'boolean') setHasBaseboard(d.hasBaseboard);
                      if (d.boilerType) setBoilerType(d.boilerType);
                      if (d.roofType) setRoofType(d.roofType);
                      if (d.sidingType) setSidingType(d.sidingType);
                      if (d.architecturalStyle) setArchitecturalStyle(d.architecturalStyle);
                      if (Array.isArray(d.features)) setFeatures(d.features.join(', '));
                    } catch (e: any) {
                      setError(e?.response?.data?.error || 'Enhance failed.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Enhance with AI (beta)
                </Button>
              </div>


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
                    onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g., 1997"
                  />
                </div>
                <div>
                  <Label htmlFor="squareFeet">Square feet (optional)</Label>
                  <Input
                    inputMode="numeric"
                    id="squareFeet"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g., 2500"
                  />
                </div>
                <div>
                  <Label htmlFor="lotSize">Lot size (acres, optional)</Label>
                  <Input
                    inputMode="decimal"
                    id="lotSize"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g., 0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="rooms"># of rooms (optional)</Label>
                  <Input
                    inputMode="numeric"
                    id="rooms"
                    value={numberOfRooms}
                    onChange={(e) => setNumberOfRooms(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g., 8"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="style">Architectural style (optional)</Label>
                  <select
                    id="style"
                    className="border rounded px-3 py-2 text-sm w-full"
                    value={architecturalStyle}
                    onChange={(e) => {
                      const key = e.target.value;
                      setArchitecturalStyle(key);
                      // (optional) pre-seed a “roomsDraft” state for preview later:
                      // setRoomsDraft(houseRoomTemplates[key] ?? []);
                    }}
                  >
                    <option value="">Select a style</option>
                    {Object.entries(architecturalStyleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
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
                  <Label>Features (comma-separated, optional)</Label>
                  <Textarea
                    placeholder="e.g., Fireplace, Finished Basement, Solar Panels"
                    value={features}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFeatures(e.target.value)
                    }
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
                  <Button onClick={saveComfortAndNext} disabled={loading}>
                    {loading ? "Saving…" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: IMAGE UPLOAD */}
          {step === 3 && (
            <div className="space-y-4">
              {!home ? (
                <p className="text-sm text-red-600">Create the home first.</p>
              ) : (
                <>
                  <Label>Upload a photo</Label>
                  <ImageUpload
                    homeId={home.id}
                    onUploadComplete={(absoluteUrl) => {
                      // No extra PUT/PATCH needed because server already saved the imageUrl
                      setHome((h) => (h ? { ...h, imageUrl: absoluteUrl } : h));
                    }}
                  />
                </>
              )}
              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={close}>Skip</Button>
                  <Button onClick={close}>Finish</Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
