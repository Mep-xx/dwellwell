// src/pages/HomeEditPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { Home } from "@shared/types/home";
import { Room } from "@shared/types/room";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import ImageUpload from "@/components/ui/imageupload";
import { useToast } from "@/components/ui/use-toast";

// Domain helpers
import {
  architecturalStyleLabels,
  houseRoomTemplates,
} from "@shared/domains/home";

type TaskSummary = {
  complete: number;
  dueSoon: number;
  overdue: number;
  total: number;
};

type LoadedHome = Home & { rooms?: Room[] };

export default function HomeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [home, setHome] = useState<LoadedHome | null>(null);

  // Form state
  const [nickname, setNickname] = useState("");
  const [apartment, setApartment] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");

  const [squareFeet, setSquareFeet] = useState<string | number>("");
  const [lotSize, setLotSize] = useState<string | number>("");
  const [yearBuilt, setYearBuilt] = useState<string | number>("");

  const [architecturalStyle, setArchitecturalStyle] = useState("");
  const [hasCentralAir, setHasCentralAir] = useState(false);
  const [hasBaseboard, setHasBaseboard] = useState(false);
  const [boilerType, setBoilerType] = useState("");
  const [roofType, setRoofType] = useState("");
  const [sidingType, setSidingType] = useState("");
  const [heatingCoolingTypes, setHeatingCoolingTypes] = useState<string[]>([]);

  const [features, setFeatures] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // ---- style options (fallback if labels are empty) ----
  const styleOptions = useMemo(() => {
    const entries = Object.entries(architecturalStyleLabels || {});
    const base =
      entries.length > 0
        ? entries
        : [
            ["Colonial", "Colonial"],
            ["Cape", "Cape"],
            ["Ranch", "Ranch"],
            ["Tudor", "Tudor"],
            ["Victorian", "Victorian"],
            ["Contemporary", "Contemporary"],
            ["Craftsman", "Craftsman"],
            ["Farmhouse", "Farmhouse"],
          ];
    return base.map(([value, label]) => ({ value, label }));
  }, []);

  // ------------------------------------------------------
  // Load home
  // ------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get(`/homes/${id}`);
        const json = res.data as LoadedHome;

        setHome(json);

        setNickname(json.nickname ?? "");
        setApartment(json.apartment ?? "");
        setAddress(json.address ?? "");
        setCity(json.city ?? "");
        setStateCode(json.state ?? "");
        setZip(json.zip ?? "");

        setSquareFeet(json.squareFeet ?? "");
        setLotSize(json.lotSize ?? "");
        setYearBuilt(json.yearBuilt ?? "");

        setArchitecturalStyle(json.architecturalStyle ?? "");
        setHasCentralAir(!!json.hasCentralAir);
        setHasBaseboard(!!json.hasBaseboard);
        setBoilerType(json.boilerType ?? "");
        setRoofType(json.roofType ?? "");
        setSidingType(json.sidingType ?? "");
        setHeatingCoolingTypes(Array.isArray(json.heatingCoolingTypes) ? json.heatingCoolingTypes : []);

        setFeatures((json.features ?? []).join(", "));
        setRooms(
          (json.rooms ?? []).map((r) => ({
            ...r,
            // keep types lined up
            floor:
              r.floor === undefined || r.floor === null
                ? undefined
                : Number(r.floor),
          }))
        );
        setImageUrl(json.imageUrl ?? null);
        setNotes(json.notes ?? "");

        // If style is known and API returned 0 rooms, seed from template
        if ((!json.rooms || json.rooms.length === 0) && json.architecturalStyle) {
          const tpl = (houseRoomTemplates as any)?.[json.architecturalStyle] ?? [];
          if (tpl.length > 0) {
            setRooms(
              tpl.map((r: any) => ({
                id: undefined as any,
                homeId: json.id,
                name: r.name,
                type: r.type,
                floor: typeof r.floor === "number" ? r.floor : undefined,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load home", err);
        toast({
          title: "Failed to load",
          description: "There was a problem loading this home.",
          variant: "destructive",
        });
        navigate("/homes");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ------------------------------------------------------
  // Style change => auto-apply default room template
  // ------------------------------------------------------
  function handleStyleChange(val: string) {
    setArchitecturalStyle(val);
    const tpl = (houseRoomTemplates as any)?.[val] ?? [];
    if (!tpl || tpl.length === 0) return;

    setRooms(() =>
      tpl.map((r: any) => ({
        id: undefined as any,
        homeId: home?.id ?? "",
        name: r.name,
        type: r.type,
        floor: typeof r.floor === "number" ? r.floor : undefined,
      }))
    );
  }

  // ------------------------------------------------------
  // Save
  // ------------------------------------------------------
  async function save() {
    if (!home) return;
    try {
      setSaving(true);

      const payload = {
        nickname: nickname.trim() || null,
        apartment: apartment.trim() || null,

        address: address.trim(),
        city: city.trim(),
        state: stateCode.trim(),
        zip: zip.trim(),

        squareFeet: squareFeet === "" ? null : Number(squareFeet),
        lotSize: lotSize === "" ? null : Number(lotSize),
        yearBuilt: yearBuilt === "" ? null : Number(yearBuilt),

        architecturalStyle: architecturalStyle || null,

        hasCentralAir,
        hasBaseboard,
        boilerType: boilerType.trim() || null,
        roofType: roofType.trim() || null,
        sidingType: sidingType.trim() || null,
        heatingCoolingTypes,

        features: features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),

        // IMPORTANT: include homeId and normalize floor
        rooms: rooms.map((r) => ({
          id: r.id,
          homeId: home.id,
          name: (r.name || "").trim(),
          type: r.type,
          floor:
            r.floor === undefined || r.floor === null || (r as any).floor === ""
              ? null
              : Number(r.floor),
        })),

        imageUrl: imageUrl?.trim() || null,
        notes: notes?.trim() || null,
      };

      await api.put(`/homes/${home.id}`, payload);

      toast({
        title: "Saved",
        description: "Your changes were saved.",
        variant: "success",
      });
    } catch (err: any) {
      console.error("Save failed:", err?.response?.data || err);
      toast({
        title: "Save failed",
        description:
          (err?.response?.data?.message as string) ||
          "The server rejected this update. I logged the error to the console.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (!home) return null;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-primary">
          Edit Home
        </h1>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/homes")}>
            Back
          </Button>
        </div>
      </div>

      {/* Basics */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Basics</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. 'The Farm Lane House'"
            />
          </div>

          <div>
            <Label htmlFor="apartment">Apartment / Unit</Label>
            <Input
              id="apartment"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="md:col-span-2 grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Details</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Architectural Style</Label>
            <Select
              value={architecturalStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
            >
              <option value="">— Select —</option>
              {styleOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Changing style will reset your room list to that style’s default template.
            </p>
          </div>

          <div>
            <Label>Square Feet</Label>
            <Input
              type="number"
              value={squareFeet}
              onChange={(e) => setSquareFeet(e.target.value)}
            />
          </div>

          <div>
            <Label>Lot Size (sq ft)</Label>
            <Input
              type="number"
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
            />
          </div>

          <div>
            <Label>Year Built</Label>
            <Input
              type="number"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
            />
          </div>

          <div>
            <Label>Boiler Type</Label>
            <Input
              value={boilerType}
              onChange={(e) => setBoilerType(e.target.value)}
            />
          </div>

          <div>
            <Label>Roof Type</Label>
            <Input
              value={roofType}
              onChange={(e) => setRoofType(e.target.value)}
            />
          </div>

          <div>
            <Label>Siding Type</Label>
            <Input
              value={sidingType}
              onChange={(e) => setSidingType(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="hasCentralAir"
              checked={hasCentralAir}
              onCheckedChange={(v) => setHasCentralAir(Boolean(v))}
            />
            <Label htmlFor="hasCentralAir" className="!m-0">
              Central Air
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="hasBaseboard"
              checked={hasBaseboard}
              onCheckedChange={(v) => setHasBaseboard(Boolean(v))}
            />
            <Label htmlFor="hasBaseboard" className="!m-0">
              Baseboard Heating
            </Label>
          </div>

          <div className="md:col-span-3">
            <Label>Features (comma separated)</Label>
            <Input
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="e.g. Fireplace, Deck, Finished Basement"
            />
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <Button
            variant="secondary"
            onClick={() =>
              setRooms((prev) => [
                ...prev,
                { id: undefined as any, homeId: home.id, name: "", type: "Other", floor: 1 } as unknown as Room,
              ])
            }
          >
            + Add Room
          </Button>
        </div>

        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rooms yet. Pick an Architectural Style to auto-populate a default room list, or add rooms manually.
          </p>
        ) : (
          <div className="grid gap-3">
            {rooms.map((r, idx) => (
              <div
                key={r.id ?? `tmp-${idx}`}
                className="grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-5"
              >
                <div className="md:col-span-2">
                  <Label>Room Name</Label>
                  <Input
                    value={r.name}
                    onChange={(e) => {
                      const next = [...rooms];
                      next[idx] = { ...next[idx], name: e.target.value } as Room;
                      setRooms(next);
                    }}
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={r.type}
                    onChange={(e) => {
                      const next = [...rooms];
                      next[idx] = { ...next[idx], type: e.target.value } as Room;
                      setRooms(next);
                    }}
                  >
                    <option value="Bedroom">Bedroom</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Dining Room">Dining Room</option>
                    <option value="Office">Office</option>
                    <option value="Basement">Basement</option>
                    <option value="Garage">Garage</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                <div>
                  <Label>Floor</Label>
                  <Input
                    type="number"
                    value={
                      r.floor === undefined || r.floor === null ? "" : r.floor
                    }
                    onChange={(e) => {
                      const next = [...rooms];
                      const v = e.target.value;
                      next[idx] = {
                        ...next[idx],
                        floor: v === "" ? undefined : Number(v),
                      } as Room;
                      setRooms(next);
                    }}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const next = [...rooms];
                      next.splice(idx, 1);
                      setRooms(next);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Photo & Notes */}
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Photo</h2>
          <ImageUpload
            value={imageUrl ?? undefined}
            onChange={(url) => setImageUrl(url || null)}
          />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Notes</h2>
          <Textarea
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering about this property."
          />
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <Button onClick={save} disabled={saving} className="w-40">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
