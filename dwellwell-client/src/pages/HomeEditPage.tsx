import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/imageupload";
import { Wand2 } from "lucide-react";

// shared (guarded)
import * as StyleModule from "@shared/architecturalStyleLabels";
import * as TemplatesModule from "@shared/houseRoomTemplates";
const styleList: string[] = Array.isArray((StyleModule as any).architecturalStyleLabels)
  ? ((StyleModule as any).architecturalStyleLabels as string[])
  : [];
const houseRoomTemplates: Record<string, { name?: string; type: string; floor?: number }[]> =
  (TemplatesModule as any).houseRoomTemplates || {};

type FloorLabel =
  | "Basement"
  | "1st Floor"
  | "2nd Floor"
  | "3rd Floor"
  | "Attic"
  | "Other";

type RoomRow = {
  key: string; // local key for React list management
  name: string;
  type: string;
  floorLabel: FloorLabel;
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
  squareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  architecturalStyle?: string | null;
  hasCentralAir: boolean;
  hasBaseboard: boolean;
  boilerType?: string | null;
  roofType?: string | null;
  sidingType?: string | null;
  features?: string[] | null;
  rooms?: { name: string; type: string; floor: number | null }[];
};

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

export default function HomeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aiNote, setAiNote] = React.useState<string | null>(null);

  // base
  const [home, setHome] = React.useState<Home | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string>("");

  const [nickname, setNickname] = React.useState("");
  const [apartment, setApartment] = React.useState("");
  const [squareFeet, setSquareFeet] = React.useState("");
  const [lotSize, setLotSize] = React.useState("");
  const [yearBuilt, setYearBuilt] = React.useState("");
  const [architecturalStyle, setArchitecturalStyle] = React.useState("");

  // comfort/exterior
  const [hasCentralAir, setHasCentralAir] = React.useState(false);
  const [hasBaseboard, setHasBaseboard] = React.useState(false);
  const [boilerType, setBoilerType] = React.useState("");
  const [roofType, setRoofType] = React.useState("");
  const [sidingType, setSidingType] = React.useState("");
  const [features, setFeatures] = React.useState("");

  // rooms
  const [rooms, setRooms] = React.useState<RoomRow[]>([]);

  // load
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/homes/${encodeURIComponent(id)}`);
        if (cancelled) return;
        const h = res.data as Home;

        setHome(h);
        setImageUrl(h.imageUrl || "");

        setNickname(h.nickname || "");
        setApartment(h.apartment || "");
        setSquareFeet(h.squareFeet ? String(h.squareFeet) : "");
        setLotSize(h.lotSize ? String(h.lotSize) : "");
        setYearBuilt(h.yearBuilt ? String(h.yearBuilt) : "");
        setArchitecturalStyle(h.architecturalStyle || "");

        setHasCentralAir(Boolean(h.hasCentralAir));
        setHasBaseboard(Boolean(h.hasBaseboard));
        setBoilerType(h.boilerType || "");
        setRoofType(h.roofType || "");
        setSidingType(h.sidingType || "");
        setFeatures((h.features || []).join(", "));

        const roomRows: RoomRow[] = (h.rooms || []).map((r, idx) => ({
          key: `r-${idx}-${r.name}-${r.type}`,
          name: r.name,
          type: r.type,
          floorLabel: floorToLabel(r.floor),
        }));
        setRooms(roomRows);
      } catch (e: any) {
        console.error("Failed to load home", e);
        setError(e?.response?.data?.message || "Failed to load home.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleStyleChange(next: string) {
    if (!next) {
      setArchitecturalStyle("");
      return;
    }

    const template = houseRoomTemplates[next];
    setArchitecturalStyle(next);

    if (!template) return;

    const hasAnyRooms = rooms.length > 0;
    const wantsReplace =
      !hasAnyRooms ||
      window.confirm(
        "Changing the style will replace the current room list with the default template. Continue?"
      );

    if (wantsReplace) {
      const mapped: RoomRow[] = template.map((r, i) => ({
        key: `tpl-${i}-${r.type}`,
        name: r.name || "",
        type: r.type,
        floorLabel: floorToLabel(r.floor ?? 1),
      }));
      setRooms(mapped);
    }
  }

  function addRoom() {
    setRooms((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        name: "",
        type: "Living Room",
        floorLabel: "1st Floor",
      },
    ]);
  }
  function updateRoom(index: number, patch: Partial<RoomRow>) {
    setRooms((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }
  function removeRoom(index: number) {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!home) return;
    setSaving(true);
    setError(null);
    setAiNote(null);
    try {
      const payload: any = {
        nickname: nickname || undefined,
        apartment: apartment || undefined,
        squareFeet: squareFeet ? Number(squareFeet) : undefined,
        lotSize: lotSize ? Number(lotSize) : undefined,
        yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
        architecturalStyle: architecturalStyle || undefined,
        hasCentralAir,
        hasBaseboard,
        boilerType: boilerType || undefined,
        roofType: roofType || undefined,
        sidingType: sidingType || undefined,
        features:
          features.trim().length > 0
            ? features.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        rooms: rooms.map((r) => ({
          name: r.name || "",
          type: r.type,
          floor: labelToFloor(r.floorLabel),
        })),
        imageUrl: imageUrl || undefined,
      };

      await api.put(`/homes/${home.id}`, payload);
      navigate("/homes");
    } catch (e: any) {
      console.error("Save failed", e);
      setError(e?.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function runEnhance() {
    if (!home) return;
    setError(null);
    setAiNote(null);
    try {
      const res = await api.post(`/homes/${home.id}/enrich`, {
        hints: {
          address: `${home.address}, ${home.city}, ${home.state} ${home.zip}`,
          sqft: squareFeet ? Number(squareFeet) : undefined,
          yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
          style: architecturalStyle || undefined,
        },
      });
      const patch = res.data?.patch || {};

      let touched = 0;

      const applyString = (value: any, setter: (s: string) => void) => {
        if (typeof value === "string" && value.trim() !== "") {
          setter(value);
          touched++;
        }
      };
      const applyNumStr = (value: any, setter: (s: string) => void) => {
        if (typeof value === "number" && !Number.isNaN(value)) {
          setter(String(value));
          touched++;
        }
      };
      const applyBool = (value: any, setter: (b: boolean) => void) => {
        if (typeof value === "boolean") {
          setter(value);
          touched++;
        }
      };

      applyString(patch.nickname, setNickname);
      applyString(patch.apartment, setApartment);
      applyNumStr(patch.squareFeet, setSquareFeet);
      applyNumStr(patch.lotSize, setLotSize);
      applyNumStr(patch.yearBuilt, setYearBuilt);
      applyString(patch.architecturalStyle, (v) => handleStyleChange(v));
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

  if (loading) {
    return (
      <div className="p-6">
        <div>Loading…</div>
      </div>
    );
  }
  if (!home) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error || "Home not found."}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Home</h1>
          <div className="text-sm text-muted-foreground">
            {home.address}, {home.city}, {home.state} {home.zip}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/homes")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {aiNote && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {aiNote}
        </div>
      )}

      {/* Photo */}
      <section className="mb-8">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Home"
            className="mb-3 h-48 w-full rounded-md object-cover"
          />
        )}
        <ImageUpload
          homeId={home.id}
          onUploadComplete={(url) => {
            setImageUrl(url);
          }}
        />
      </section>

      {/* Basics */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium">Basics</h2>
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
            <Label htmlFor="squareFeet">Square feet (optional)</Label>
            <Input
              id="squareFeet"
              inputMode="numeric"
              value={squareFeet}
              onChange={(e) =>
                setSquareFeet(e.target.value.replace(/\D/g, ""))
              }
              placeholder="e.g., 2500"
            />
          </div>
          <div>
            <Label htmlFor="lotSize">Lot size (acres, optional)</Label>
            <Input
              id="lotSize"
              inputMode="decimal"
              value={lotSize}
              onChange={(e) =>
                setLotSize(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="e.g., 0.5"
            />
          </div>
          <div>
            <Label htmlFor="yearBuilt">Year built (optional)</Label>
            <Input
              id="yearBuilt"
              inputMode="numeric"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g., 1997"
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
      </section>

      {/* Comfort & Exterior */}
      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Comfort & Exterior</h2>
          <Button variant="outline" onClick={runEnhance} title="Enhance with AI">
            <Wand2 className="mr-2 h-4 w-4" /> Enhance with AI
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Central Air</div>
              <div className="text-sm text-muted-foreground">
                Does the home have central A/C?
              </div>
            </div>
            <Switch
              checked={hasCentralAir}
              onCheckedChange={setHasCentralAir}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Baseboard Heating</div>
              <div className="text-sm text-muted-foreground">
                Hydronic baseboards present?
              </div>
            </div>
            <Switch
              checked={hasBaseboard}
              onCheckedChange={setHasBaseboard}
            />
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
            <Select
              value={roofType}
              onChange={(e) => setRoofType(e.target.value)}
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
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="e.g., Fireplace, Finished Basement, Solar Panels"
            />
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Rooms</h2>
          <Button variant="secondary" onClick={addRoom}>
            + Add Room
          </Button>
        </div>
        {rooms.length === 0 ? (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            No rooms yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {rooms.map((r, idx) => (
              <div
                key={r.key}
                className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-12"
              >
                <div className="md:col-span-5">
                  <Label>Name</Label>
                  <Input
                    value={r.name}
                    onChange={(e) => updateRoom(idx, { name: e.target.value })}
                    placeholder="e.g., Living Room"
                  />
                </div>
                <div className="md:col-span-5">
                  <Label>Type</Label>
                  <Input
                    value={r.type}
                    onChange={(e) => updateRoom(idx, { type: e.target.value })}
                    placeholder="e.g., Living Room"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Floor</Label>
                  <Select
                    value={r.floorLabel}
                    onChange={(e) =>
                      updateRoom(idx, {
                        floorLabel: e.target.value as FloorLabel,
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
                <div className="md:col-span-12">
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" onClick={() => removeRoom(idx)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="ghost" onClick={() => navigate("/homes")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
