// src/components/EditHomeModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/imageupload";
import { api } from "@/utils/api";
import { Home } from "@shared/types/home";
import { Room } from "@shared/types/room";
import { architecturalStyleLabels } from "@shared/architecturalStyleLabels";
import { houseRoomTemplates } from "@shared/houseRoomTemplates";

type Props = {
  isOpen: boolean;
  home: Home;
  onSave: (updated: Partial<Home> & Partial<HomeExtras> & { rooms?: Room[] }) => void;
  onCancel: () => void;
};

// extra fields your API accepts but aren't in the base Home type
type HomeExtras = {
  numberOfRooms: number;
  hasCentralAir: boolean;
  hasBaseboard: boolean;
  boilerType: string;
  roofType: string;
  sidingType: string;
  heatingCoolingTypes: string[];
  features: string[];
  imageUrl: string;
};

const heatingCoolingOptions = [
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
];

const boilerTypes = ["", "Gas-Fired", "Oil-Fired", "Electric", "Steam", "Hot Water", "Combination (Combi)", "Condensing", "Other"];
const roofTypes = ["", "Asphalt Shingle", "Metal", "Tile", "Slate", "Wood Shake", "Rubber (EPDM)", "Flat / Built-up", "Other"];
const sidingTypes = ["", "Vinyl", "Wood", "Fiber Cement", "Stucco", "Brick", "Stone", "Metal", "Other"];

// if architecturalStyleLabels is already a string[], no need for Object.values
const styleOptions: string[] = Array.isArray(architecturalStyleLabels)
  ? architecturalStyleLabels
  : Object.values(architecturalStyleLabels as any);

function absolutizeFromApiBase(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = api.defaults.baseURL ?? window.location.origin; // e.g. http://localhost:4000/api
  const apiOrigin = new URL("/", base).origin;                 // http://localhost:4000
  const trimmed = String(pathOrUrl).replace(/^\/?api\/?/, "").replace(/^\/?/, "");
  return `${apiOrigin}/${trimmed}`;
}

export function EditHomeModal({ isOpen, home, onSave, onCancel }: Props) {
  // ===== Basics =====
  const [nickname, setNickname] = useState("");
  const [apartment, setApartment] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [numberOfRooms, setNumberOfRooms] = useState("");
  const [architecturalStyle, setArchitecturalStyle] = useState("");

  // ===== Comfort & exterior =====
  const [hasCentralAir, setHasCentralAir] = useState(false);
  const [hasBaseboard, setHasBaseboard] = useState(false);
  const [boilerType, setBoilerType] = useState("");
  const [roofType, setRoofType] = useState("");
  const [sidingType, setSidingType] = useState("");
  const [heatingCoolingTypes, setHeatingCoolingTypes] = useState<string[]>([]);
  const [features, setFeatures] = useState<string>(""); // CSV in UI

  // ===== Image =====
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // ===== Style change flags =====
  const originalStyle = home.architecturalStyle ?? "";
  const [styleChanged, setStyleChanged] = useState(false);
  const [wantsResetRooms, setWantsResetRooms] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Basics
    setNickname(home.nickname ?? "");
    setApartment(home.apartment ?? "");
    setYearBuilt(home.yearBuilt ? String(home.yearBuilt) : "");
    setSquareFeet(home.squareFeet ? String(home.squareFeet) : "");
    setLotSize(home.lotSize ? String(home.lotSize) : "");
    setNumberOfRooms((home as any).numberOfRooms ? String((home as any).numberOfRooms) : "");
    setArchitecturalStyle(home.architecturalStyle ?? "");

    // Comfort/exterior
    setHasCentralAir(Boolean((home as any).hasCentralAir));
    setHasBaseboard(Boolean((home as any).hasBaseboard));
    setBoilerType((home as any).boilerType ?? "");
    setRoofType((home as any).roofType ?? "");
    setSidingType((home as any).sidingType ?? "");
    setHeatingCoolingTypes((home as any).heatingCoolingTypes ?? []);
    const feats = (home as any).features;
    setFeatures(Array.isArray(feats) ? feats.join(", ") : (typeof feats === "string" ? feats : ""));

    // Image
    setImageUrl((home as any).imageUrl ?? null);

    // reset flags
    setStyleChanged(false);
    setWantsResetRooms(false);
  }, [isOpen, home]);

  const previewSrc = useMemo(() => {
    if (!imageUrl) return "/images/home_placeholder.png";
    const abs = absolutizeFromApiBase(imageUrl);
    return `${abs}${abs.includes("?") ? "&" : "?"}t=${Date.now()}`;
  }, [imageUrl]);

  function buildTemplateRooms(style: string): Room[] {
    const tpl = (houseRoomTemplates as Record<string, Array<{ name?: string; type: string; floor?: number }>>)[style] ?? [];
    return tpl.map((r) => ({
      name: r.name ?? "",
      type: r.type,
      floor: typeof r.floor === "number" ? r.floor : 1,
    })) as Room[];
  }

  function handleStyleChange(nextStyle: string) {
    setArchitecturalStyle(nextStyle);
    const changed = (nextStyle || "") !== (originalStyle || "");
    setStyleChanged(changed);
    if (!changed) setWantsResetRooms(false);
  }

  function handleSaveClick() {
    const payload: Partial<Home> & Partial<HomeExtras> & { rooms?: Room[] } = {
      nickname: nickname || undefined,
      apartment: apartment || undefined,
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
      squareFeet: squareFeet ? Number(squareFeet) : undefined,
      lotSize: lotSize ? Number(lotSize) : undefined,
      architecturalStyle: architecturalStyle || undefined,
      imageUrl: imageUrl || undefined,

      // overlay fields
      numberOfRooms: numberOfRooms ? Number(numberOfRooms) : undefined,
      hasCentralAir,
      hasBaseboard,
      boilerType: boilerType || undefined,
      roofType: roofType || undefined,
      sidingType: sidingType || undefined,
      heatingCoolingTypes: heatingCoolingTypes.length ? heatingCoolingTypes : undefined,
      features: features.trim()
        ? features.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    };

    if (styleChanged && wantsResetRooms) {
      payload.rooms = buildTemplateRooms(architecturalStyle);
    }

    onSave(payload);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent aria-describedby="edit-home-desc" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Home</DialogTitle>
          <DialogDescription id="edit-home-desc">
            Update your home’s basics, comfort systems, and photo. Changing style can optionally reset rooms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basics */}
          <section className="space-y-3">
            <h3 className="font-semibold">Basics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Nickname</label>
                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g., Current Home" />
              </div>
              <div>
                <label className="block text-sm mb-1">Apt / Unit</label>
                <Input value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="e.g., Unit 3B" />
              </div>
              <div>
                <label className="block text-sm mb-1">Year Built</label>
                <Input inputMode="numeric" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, ""))} placeholder="1997" />
              </div>
              <div>
                <label className="block text-sm mb-1">Square Feet</label>
                <Input inputMode="numeric" value={squareFeet} onChange={(e) => setSquareFeet(e.target.value.replace(/\D/g, ""))} placeholder="2500" />
              </div>
              <div>
                <label className="block text-sm mb-1">Lot Size (acres)</label>
                <Input inputMode="decimal" value={lotSize} onChange={(e) => setLotSize(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.5" />
              </div>
              <div>
                <label className="block text-sm mb-1"># of Rooms</label>
                <Input inputMode="numeric" value={numberOfRooms} onChange={(e) => setNumberOfRooms(e.target.value.replace(/\D/g, ""))} placeholder="8" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Architectural Style</label>
                <select
                  value={architecturalStyle}
                  onChange={(e) => handleStyleChange(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">Select style</option>
                  {styleOptions.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>

                {styleChanged && (
                  <div className="mt-2 rounded border p-3 text-sm">
                    <div className="font-medium mb-1">
                      Style changed from “{originalStyle || "—"}” to “{architecturalStyle || "—"}”.
                    </div>
                    <p className="text-muted-foreground">
                      You can reset the home’s rooms to the recommended template for this style. This will{" "}
                      <strong>replace all existing rooms (and anything inside them)</strong>.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant={wantsResetRooms ? "default" : "outline"}
                        onClick={() => setWantsResetRooms(true)}
                      >
                        Reset rooms to template
                      </Button>
                      <Button
                        variant={!wantsResetRooms ? "default" : "outline"}
                        onClick={() => setWantsResetRooms(false)}
                      >
                        Keep current rooms
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Comfort & Exterior */}
          <section className="space-y-3">
            <h3 className="font-semibold">Comfort & Exterior</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">Central Air</div>
                  <div className="text-sm text-muted-foreground">Does the home have central A/C?</div>
                </div>
                <Switch checked={hasCentralAir} onCheckedChange={setHasCentralAir} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">Baseboard Heating</div>
                  <div className="text-sm text-muted-foreground">Hydronic baseboards present?</div>
                </div>
                <Switch checked={hasBaseboard} onCheckedChange={setHasBaseboard} />
              </div>

              <div>
                <label className="block text-sm mb-1">Boiler / Furnace</label>
                <select className="border rounded px-3 py-2 text-sm w-full" value={boilerType} onChange={(e) => setBoilerType(e.target.value)}>
                  {boilerTypes.map((v) => (
                    <option key={v} value={v}>{v || "Select type"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Roof</label>
                <select className="border rounded px-3 py-2 text-sm w-full" value={roofType} onChange={(e) => setRoofType(e.target.value)}>
                  {roofTypes.map((v) => (
                    <option key={v} value={v}>{v || "Select roof type"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Siding</label>
                <select className="border rounded px-3 py-2 text-sm w-full" value={sidingType} onChange={(e) => setSidingType(e.target.value)}>
                  {sidingTypes.map((v) => (
                    <option key={v} value={v}>{v || "Select siding type"}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Heating & Cooling Systems</label>
                <div className="grid grid-cols-2 gap-2">
                  {heatingCoolingOptions.map((option) => (
                    <label key={option} className="text-sm">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={heatingCoolingTypes.includes(option)}
                        onChange={() =>
                          setHeatingCoolingTypes((prev) =>
                            prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
                          )
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Features (comma-separated)</label>
                <Textarea
                  placeholder="e.g., Fireplace, Finished Basement, Solar Panels"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Image */}
          <section className="space-y-3">
            <h3 className="font-semibold">Home Photo</h3>
            {imageUrl && (
              <img src={previewSrc} alt="Home" className="rounded w-full max-h-48 object-cover" />
            )}
            <ImageUpload
              homeId={home.id}
              onUploadComplete={async (url) => {
                try {
                  await api.put(`/homes/${home.id}`, { imageUrl: url });
                } catch {
                  /* non-blocking */
                }
                setImageUrl(url);
              }}
            />
          </section>

          {/* Footer */}
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSaveClick}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditHomeModal;
