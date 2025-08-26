// src/pages/HomeEditPage.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select"; // simple styled <select>
import ImageUpload from "@/components/ui/imageupload";

import { Home } from "@shared/types/home";
import { Room } from "@shared/types/room";
import { architecturalStyleLabels } from "@shared/architecturalStyleLabels";
import { houseRoomTemplates } from "@shared/houseRoomTemplates";

type TaskSummary = { complete: number; dueSoon: number; overdue: number; total: number };

function normalizeLabels(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((v): v is string => typeof v === "string");
  if (input && typeof input === "object") {
    // @ts-ignore probing flexible shapes
    if (Array.isArray(input.labels)) return input.labels.filter((v: unknown): v is string => typeof v === "string");
    return Object.values(input).filter((v): v is string => typeof v === "string");
  }
  return [];
}
const styleOptions = normalizeLabels(architecturalStyleLabels);

export default function HomeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [home, setHome] = React.useState<Home | null>(null);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [taskSummary, setTaskSummary] = React.useState<TaskSummary | undefined>(undefined);

  // form state (kept aligned with AddHomeWizard)
  const [nickname, setNickname] = React.useState("");
  const [apartment, setApartment] = React.useState("");
  const [squareFeet, setSquareFeet] = React.useState<string>("");
  const [lotSize, setLotSize] = React.useState<string>("");
  const [yearBuilt, setYearBuilt] = React.useState<string>("");
  const [architecturalStyle, setArchitecturalStyle] = React.useState<string>("");

  const [hasCentralAir, setHasCentralAir] = React.useState(false);
  const [hasBaseboard, setHasBaseboard] = React.useState(false);
  const [boilerType, setBoilerType] = React.useState("");
  const [roofType, setRoofType] = React.useState("");
  const [sidingType, setSidingType] = React.useState("");
  const [heatingCoolingTypes, setHeatingCoolingTypes] = React.useState<string[]>([]);
  const [features, setFeatures] = React.useState<string[]>([]);
  const [imageUrl, setImageUrl] = React.useState<string>("");

  // load from /homes (list) + /homes/:id/summary
  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const [listRes, summaryRes] = await Promise.all([
          api.get<Home[]>("/homes"),
          id ? api.get(`/homes/${id}/summary`).catch(() => ({ data: undefined })) : Promise.resolve({ data: undefined }),
        ]);

        if (ignore) return;

        const h = listRes.data.find((x) => x.id === id);
        if (!h) {
          toast({
            title: "Home not found",
            description: "We couldn’t find that home. Taking you back.",
            variant: "destructive",
          });
          navigate("/homes");
          return;
        }

        setHome(h);
        setTaskSummary(summaryRes?.data);

        // if your list already includes rooms, keep them; otherwise start empty
        setRooms(((h as any).rooms as Room[]) ?? []);

        setNickname(h.nickname ?? "");
        setApartment(h.apartment ?? "");
        setSquareFeet(h.squareFeet ? String(h.squareFeet) : "");
        setLotSize(h.lotSize ? String(h.lotSize) : "");
        setYearBuilt(h.yearBuilt ? String(h.yearBuilt) : "");
        setArchitecturalStyle(h.architecturalStyle ?? "");
        setHasCentralAir((h as any).hasCentralAir ?? false);
        setHasBaseboard((h as any).hasBaseboard ?? false);
        setBoilerType((h as any).boilerType ?? "");
        setRoofType((h as any).roofType ?? "");
        setSidingType((h as any).sidingType ?? "");
        setHeatingCoolingTypes((h as any).heatingCoolingTypes ?? []);
        setFeatures((h as any).features ?? []);
        setImageUrl((h as any).imageUrl ?? "");
      } catch (err) {
        console.error("Failed to load home", err);
        toast({
          title: "Could not load home",
          description: "Please go back and try again.",
          variant: "destructive",
        });
        navigate("/homes");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
    return () => {
      ignore = true;
    };
  }, [id, navigate, toast]);

  const save = async () => {
    if (!home) return;
    setSaving(true);
    try {
      await api.put(`/homes/${home.id}`, {
        nickname: nickname || undefined,
        apartment: apartment || undefined,
        squareFeet: squareFeet ? Number(squareFeet) : undefined,
        lotSize: lotSize ? Number(lotSize) : undefined,
        yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
        architecturalStyle: architecturalStyle || undefined,
        // booleans always included to satisfy validators
        hasCentralAir,
        hasBaseboard,
        boilerType: boilerType || undefined,
        roofType: roofType || undefined,
        sidingType: sidingType || undefined,
        heatingCoolingTypes: heatingCoolingTypes.length ? heatingCoolingTypes : undefined,
        features: features.length ? features : undefined,
        imageUrl: imageUrl || undefined,
        rooms, // send if your API supports updating rooms here
      });
      toast({ title: "Saved", description: "Home updated successfully.", variant: "success" });
      navigate("/homes");
    } catch (err) {
      console.error("Save error", err);
      toast({
        title: "Save failed",
        description: "Please check your entries and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyStyleTemplate = () => {
    if (!architecturalStyle) return;
    const tmpl = (houseRoomTemplates as Record<string, Array<Partial<Room>>>)[architecturalStyle];
    if (!tmpl) {
      toast({ title: "No template", description: "No template available for this style.", variant: "info" });
      return;
    }
    const ok = window.confirm(
      "Changing the architectural style and applying its template can REPLACE your current rooms. Continue?"
    );
    if (!ok) return;

    const nextRooms: Room[] = tmpl.map((r) => ({
      name: (r as any).name || "",
      type: (r as any).type || "Other",
      floor: (r as any).floor ?? 1,
    })) as Room[];

    setRooms(nextRooms);
    toast({ title: "Rooms updated", description: "Loaded default rooms for this style.", variant: "success" });
  };

  const handleEnhance = async () => {
    if (!home) return;
    try {
      const res = await api.post(`/homes/${home.id}/enrich`);
      const s = res.data || {};
      setYearBuilt(s.yearBuilt ? String(s.yearBuilt) : yearBuilt);
      setRoofType(s.roofType ?? roofType);
      setSidingType(s.sidingType ?? sidingType);
      if (Array.isArray(s.heatingCoolingTypes)) setHeatingCoolingTypes(s.heatingCoolingTypes);
      if (Array.isArray(s.features)) setFeatures(s.features);
      toast({ title: "Enhanced", description: "We filled in a few details for you.", variant: "success" });
    } catch (e) {
      console.error("Enhance error", e);
      toast({
        title: "Enhance failed",
        description: "We couldn’t fetch suggestions right now.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!home) return null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Home</h1>
          <p className="text-sm text-muted-foreground">
            {home.address}
            {home.apartment ? `, Apt ${home.apartment}` : ""}
            {", "}
            {home.city}, {home.state} {home.zip}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Image */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Photo</h2>
        {imageUrl ? (
          <img src={imageUrl} alt="Home" className="w-full max-h-64 object-cover rounded border" />
        ) : (
          <div className="rounded border p-4 text-sm text-muted-foreground">No photo yet.</div>
        )}
        <ImageUpload
          homeId={home.id}
          onUploadComplete={(absoluteUrl) => {
            setImageUrl(absoluteUrl);
            toast({ title: "Photo uploaded", description: "We updated the home image.", variant: "success" });
          }}
        />
      </section>

      {/* Basics */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Basics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Current Home"
            />
          </div>
          <div>
            <Label htmlFor="apartment">Apt / Unit</Label>
            <Input
              id="apartment"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              placeholder="e.g., Unit 3B"
            />
          </div>
          <div>
            <Label htmlFor="squareFeet">Square feet</Label>
            <Input
              id="squareFeet"
              inputMode="numeric"
              value={squareFeet}
              onChange={(e) => setSquareFeet((e.target.value ?? "").replace(/\D/g, ""))}
            />
          </div>
          <div>
            <Label htmlFor="lotSize">Lot size (acres)</Label>
            <Input
              id="lotSize"
              inputMode="decimal"
              value={lotSize}
              onChange={(e) => setLotSize((e.target.value ?? "").replace(/[^0-9.]/g, ""))}
            />
          </div>
          <div>
            <Label htmlFor="yearBuilt">Year built</Label>
            <Input
              id="yearBuilt"
              inputMode="numeric"
              value={yearBuilt}
              onChange={(e) => setYearBuilt((e.target.value ?? "").replace(/\D/g, ""))}
            />
          </div>

          <div>
            <Label htmlFor="style">Architectural style</Label>
            <div className="flex flex-col sm:flex-row gap-2">
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
              <Button
                type="button"
                variant="outline"
                onClick={applyStyleTemplate}
                disabled={!architecturalStyle}
                title={architecturalStyle ? "Replace rooms with defaults for this style" : "Choose a style first"}
              >
                Apply Style’s Default Rooms
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Changing style? Applying the default rooms will replace your current list.
            </p>
          </div>
        </div>
      </section>

      {/* Comfort & Exterior */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Comfort & Exterior</h2>
          <Button variant="secondary" onClick={handleEnhance} title="Try to auto-fill details">
            ✨ Enhance with AI
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="font-medium">Central Air</div>
              <div className="text-sm text-muted-foreground">Does the home have central A/C?</div>
            </div>
            <Switch checked={hasCentralAir} onCheckedChange={setHasCentralAir} />
          </div>
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="font-medium">Baseboard Heating</div>
              <div className="text-sm text-muted-foreground">Hydronic baseboards present?</div>
            </div>
            <Switch checked={hasBaseboard} onCheckedChange={setHasBaseboard} />
          </div>

          <div>
            <Label>Boiler / Furnace</Label>
            <Select value={boilerType} onChange={(e) => setBoilerType(e.target.value)} aria-label="Boiler or Furnace Type">
              <option value="">Select type</option>
              <option value="Gas-Fired">Gas-Fired</option>
              <option value="Oil-Fired">Oil-Fired</option>
              <option value="Electric">Electric</option>
              <option value="None">None</option>
            </Select>
          </div>

          <div>
            <Label>Roof</Label>
            <Select value={roofType} onChange={(e) => setRoofType(e.target.value)} aria-label="Roof Type">
              <option value="">Select roof type</option>
              <option value="Asphalt Shingle">Asphalt Shingle</option>
              <option value="Metal">Metal</option>
              <option value="Tile">Tile</option>
              <option value="Slate">Slate</option>
            </Select>
          </div>

          <div>
            <Label>Siding</Label>
            <Select value={sidingType} onChange={(e) => setSidingType(e.target.value)} aria-label="Siding Type">
              <option value="">Select siding type</option>
              <option value="Vinyl">Vinyl</option>
              <option value="Wood">Wood</option>
              <option value="Fiber Cement">Fiber Cement</option>
              <option value="Brick">Brick</option>
            </Select>
          </div>
        </div>
      </section>

      {/* Rooms (simple editable list for now) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <Button
            variant="outline"
            onClick={() =>
              setRooms((prev) => [...prev, { name: "", type: "Other", floor: 1 } as unknown as Room])
            }
          >
            + Add Room
          </Button>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded border p-4 text-sm text-muted-foreground">
            No rooms yet. Use “Apply Style’s Default Rooms” or add them manually.
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((r, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded border p-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={r.name || ""}
                    onChange={(e) => {
                      const next = [...rooms];
                      next[idx] = { ...next[idx], name: e.target.value } as Room;
                      setRooms(next);
                    }}
                    placeholder="e.g., Living Room"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input
                    value={(r as any).type || ""}
                    onChange={(e) => {
                      const next = [...rooms];
                      (next[idx] as any).type = e.target.value || "Other";
                      setRooms(next);
                    }}
                    placeholder="e.g., Bedroom"
                  />
                </div>
                <div>
                  <Label>Floor</Label>
                  <Select
                    value={String(r.floor ?? 1)}
                    onChange={(e) => {
                      const next = [...rooms];
                      next[idx] = { ...next[idx], floor: Number(e.target.value) } as Room;
                      setRooms(next);
                    }}
                  >
                    <option value="-1">Basement</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="99">Attic</option>
                    <option value="0">Other</option>
                  </Select>
                </div>
                <div className="flex items-end justify-end">
                  <Button variant="ghost" onClick={() => setRooms((prev) => prev.filter((_, i) => i !== idx))}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sticky footer (mobile-friendly action bar) */}
      <div className="h-16" />
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
