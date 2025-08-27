// dwellwell-client/src/pages/HomeEditPage.tsx
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

// Centralized options (new file below)
import {
  BOILER_TYPES,
  ROOF_TYPES,
  ROOM_TYPES,
  SIDING_TYPES,
  FEATURE_SUGGESTIONS,
  HOUSE_ROOM_TEMPLATES,
  ARCHITECTURAL_STYLES,
} from "@constants";


type LoadedHome = Home & {
  rooms?: Room[];
  features?: string[] | null;
  imageUrl?: string | null;
  boilerType?: string | null;
  roofType?: string | null;
  sidingType?: string | null;
  hasCentralAir?: boolean | null;
  hasBaseboard?: boolean | null;
  architecturalStyle?: string | null;
};

export default function HomeEditPage() {
  const { id: homeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [home, setHome] = useState<LoadedHome | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Debounced background patcher for simple fields
  const saveTimer = useRef<number | null>(null);
  const patch = (partial: Partial<LoadedHome>) => {
    setHome((h) => (h ? { ...h, ...partial } : h));
    if (!homeId) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        setSaving(true);
        await api.put(`/homes/${homeId}`, partial);
      } catch {
        toast({
          title: "Save failed",
          description: "Could not persist your latest changes.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/homes/${homeId}`);
        if (!mounted) return;
        const h: LoadedHome = data;
        setHome(h);
        setRooms(h.rooms ?? []);
        setFeatures(h.features ?? []);
      } catch (e) {
        toast({
          title: "Load failed",
          description: "Could not load this home.",
          variant: "destructive",
        });
        navigate("/homes");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  const styleKey = home?.architecturalStyle || "";
  const styleOptions = useMemo(
    () =>
      Object.entries(ARCHITECTURAL_STYLES).map(([value, label]) => ({
        value,
        label,
      })),
    []
  );

  const suggestableRooms = useMemo(() => {
    if (!styleKey) return [];
    const template = HOUSE_ROOM_TEMPLATES[styleKey] || [];
    const existing = new Set(rooms.map((r) => r.name.toLowerCase()));
    return template.filter((t) => !existing.has(t.name.toLowerCase()));
  }, [rooms, styleKey]);

  const onImageUploaded = async (absoluteUrl: string) => {
    patch({ imageUrl: absoluteUrl });
    try {
      setSaving(true);
      await api.put(`/homes/${homeId}`, { imageUrl: absoluteUrl });
      toast({ title: "Photo updated", description: "Main photo replaced." });
    } catch {
      toast({
        title: "Photo not saved",
        description: "Upload succeeded but server update failed.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addFeature = (raw: string) => {
    const val = raw.trim();
    if (!val) return;
    if (features.includes(val)) return;
    const next = [...features, val];
    setFeatures(next);
    patch({ features: next });
  };
  const removeFeature = (val: string) => {
    const next = features.filter((f) => f !== val);
    setFeatures(next);
    patch({ features: next });
  };

  const addRoom = async (name: string, type?: string, floor?: number) => {
    if (!homeId) return;
    try {
      setSaving(true);
      const { data } = await api.post("/rooms", {
        homeId,
        name: name || "New Room",
        type: type || "Other",
        floor: floor ?? 1,
      });
      setRooms((prev) => [...prev, data as Room]);
    } catch {
      toast({
        title: "Failed to add room",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSuggestedRooms = async () => {
    for (const r of suggestableRooms) {
      // serial to keep it simple (swap to Promise.all if your API can handle burst)
      // eslint-disable-next-line no-await-in-loop
      await addRoom(r.name, r.type, r.floor);
    }
    toast({
      title: "Rooms added",
      description: `Added ${suggestableRooms.length} suggested room(s).`,
      variant: "success",
    });
  };

  const saveAll = async () => {
    if (!homeId || !home) return;
    try {
      setSaving(true);
      await api.put(`/homes/${homeId}`, {
        nickname: home.nickname,
        apartment: (home as any).apartment ?? (home as any).apartmentUnit ?? "",
        squareFeet: home.squareFeet ?? null,
        lotSize: (home as any).lotSize ?? (home as any).lotSizeSqft ?? null,
        yearBuilt: home.yearBuilt ?? null,
        imageUrl: home.imageUrl ?? null,
        boilerType: home.boilerType ?? null,
        roofType: home.roofType ?? null,
        sidingType: home.sidingType ?? null,
        hasCentralAir: !!home.hasCentralAir,
        hasBaseboard: !!home.hasBaseboard,
        architecturalStyle: home.architecturalStyle ?? null,
        features,
      });
      toast({ title: "Saved", description: "Home updated." });
    } catch {
      toast({
        title: "Save failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !home) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading home…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Home</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/homes")}>
            Back
          </Button>
          <Button onClick={saveAll} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Photo first; uploader BELOW acts as replace */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-lg border p-3">
            <div className="aspect-[4/3] w-full rounded overflow-hidden bg-muted/40">
              {home.imageUrl ? (
                <img
                  src={home.imageUrl}
                  alt="Home"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
                  No photo yet
                </div>
              )}
            </div>

            {/* Uploader below; treat as replace */}
            <div className="mt-3">
              {/* If you apply the optional tweak below, pass showPreview={false} */}
              <ImageUpload homeId={home.id} onUploadComplete={onImageUploaded} />
            </div>
          </div>
        </div>

        {/* Basics */}
        <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={home.nickname || ""}
              onChange={(e) => patch({ nickname: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <Label htmlFor="apartment">Apartment / Unit</Label>
            <Input
              id="apartment"
              value={(home as any).apartment || (home as any).apartmentUnit || ""}
              onChange={(e) => patch({ ...(home as any), apartment: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <Label htmlFor="style">Architectural Style</Label>
            <Select
              id="style"
              value={home.architecturalStyle || ""}
              onChange={(e) => patch({ architecturalStyle: e.target.value || null })}
            >
              <option value="">(Select style)</option>
              {styleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {String(opt.label)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              type="number"
              inputMode="numeric"
              value={home.yearBuilt ?? ""}
              onChange={(e) => patch({ yearBuilt: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g., 1997"
            />
          </div>

          <div>
            <Label htmlFor="squareFeet">Square Feet</Label>
            <Input
              id="squareFeet"
              type="number"
              inputMode="numeric"
              value={home.squareFeet ?? ""}
              onChange={(e) => patch({ squareFeet: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g., 2400"
            />
          </div>

          <div>
            <Label htmlFor="lotSize">Lot Size (sqft)</Label>
            <Input
              id="lotSize"
              type="number"
              inputMode="numeric"
              value={(home as any).lotSize ?? (home as any).lotSizeSqft ?? ""}
              onChange={(e) =>
                patch({ ...(home as any), lotSize: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="e.g., 20000"
            />
          </div>
        </div>
      </div>

      {/* Building details */}
      <div className="mt-8 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Building Details</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Boiler / HVAC</Label>
            <Select
              value={home.boilerType || ""}
              onChange={(e) => patch({ boilerType: e.target.value || null })}
            >
              <option value="">(Select…)</option>
              {BOILER_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Roof Type</Label>
            <Select
              value={home.roofType || ""}
              onChange={(e) => patch({ roofType: e.target.value || null })}
            >
              <option value="">(Select…)</option>
              {ROOF_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Siding Type</Label>
            <Select
              value={home.sidingType || ""}
              onChange={(e) => patch({ sidingType: e.target.value || null })}
            >
              <option value="">(Select…)</option>
              {SIDING_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!home.hasCentralAir}
              onChange={(e) => patch({ hasCentralAir: e.target.checked })}
            />
            <span>Central Air</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!home.hasBaseboard}
              onChange={(e) => patch({ hasBaseboard: e.target.checked })}
            />
            <span>Baseboard Heating</span>
          </label>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Features</h2>

        <div className="flex gap-2">
          <Input
            placeholder="Type a feature and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {FEATURE_SUGGESTIONS.map((f) => (
              <button
                key={f}
                onClick={() => addFeature(f)}
                className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
              >
                + {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {features.length === 0 ? (
            <span className="text-sm text-muted-foreground">No features yet.</span>
          ) : (
            features.map((f) => (
              <span key={f} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                {f}
                <button className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => removeFeature(f)}>
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Rooms */}
      <div className="mt-8 rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <div className="space-x-2">
            {suggestableRooms.length > 0 && (
              <Button variant="outline" onClick={addSuggestedRooms}>
                Add {suggestableRooms.length} Suggested
              </Button>
            )}
            <Button onClick={() => addRoom("New Room", "Other", 1)}>Add Room</Button>
          </div>
        </div>

        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Floor</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{typeof r.floor === "number" ? r.floor : ""}</td>
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
