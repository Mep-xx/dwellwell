// src/pages/HomeEditPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/utils/api";

// Types (from shared)
import type { Home } from "@shared/types/home";
import type { Room } from "@shared/types/room";

// UI
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

// Helpers
import { architecturalStyleLabels } from "@shared/architecturalStyleLabels";
import { houseRoomTemplates } from "@shared/houseRoomTemplates";

type LoadedHome = Home & { rooms?: Room[] };

type FormState = {
  nickname: string;
  architecturalStyle: string;
  squareFeet: string;   // keep as string for inputs; convert on save
  lotSize: string;
  yearBuilt: string;
  hasCentralAir: boolean;
  hasBaseboard: boolean;
  boilerType: string;
  roofType: string;
  sidingType: string;
  featuresCsv: string;   // comma separated features
  imageUrl?: string | null;
};

export default function HomeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [home, setHome] = useState<LoadedHome | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Architectural style options
  const styleOptions = useMemo(() => {
    return Object.entries(architecturalStyleLabels).map(([value, label]) => ({
      value,
      label,
    }));
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get<LoadedHome>(`/homes/${id}`);
        if (!mounted) return;
        const h = res.data;

        // Prime form state
        const f: FormState = {
          nickname: h.nickname ?? "",
          architecturalStyle: h.architecturalStyle ?? "",
          squareFeet: h.squareFeet ? String(h.squareFeet) : "",
          lotSize: h.lotSize ? String(h.lotSize) : "",
          yearBuilt: h.yearBuilt ? String(h.yearBuilt) : "",
          hasCentralAir: Boolean((h as any).hasCentralAir ?? false),
          hasBaseboard: Boolean((h as any).hasBaseboard ?? false),
          boilerType: (h as any).boilerType ?? "",
          roofType: (h as any).roofType ?? "",
          sidingType: (h as any).sidingType ?? "",
          featuresCsv: Array.isArray((h as any).features)
            ? ((h as any).features as string[]).join(", ")
            : "",
          imageUrl: (h as any).imageUrl ?? null,
        };

        setHome(h);
        setForm(f);
        // If no rooms came back but a style exists, preload room template
        setRooms(
          h.rooms && h.rooms.length
            ? h.rooms
            : h.architecturalStyle
            ? (houseRoomTemplates as any)[h.architecturalStyle]
              ? (houseRoomTemplates as any)[h.architecturalStyle].map(
                  (r: any, i: number) => ({
                    id: `tmp-${i}-${Date.now()}`,
                    name: r.name,
                    type: r.type,
                    floor: r.floor,
                    homeId: h.id as any,
                  })
                )
              : []
            : []
        );
      } catch (err) {
        console.error("[HomeEdit] load failed", err);
        toast({
          title: "Failed to load home",
          description: "Please try again.",
          variant: "destructive",
        });
        navigate("/homes");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id, navigate, toast]);

  // Auto-apply default rooms when style changes from empty to something or between styles
  function handleStyleChange(nextStyle: string) {
    if (!form) return;
    setForm({ ...form, architecturalStyle: nextStyle });

    // Only apply template if we actually have a template for this style
    const tpl = houseRoomTemplates[nextStyle as keyof typeof houseRoomTemplates];
    if (tpl && Array.isArray(tpl) && tpl.length) {
      const newRooms: Room[] = tpl.map((r, i) => ({
        // generate a temporary id for UI; server owns real ids
        id: (rooms[i]?.id ?? `tmp-${i}-${Date.now()}`) as any,
        name: r.name,
        type: r.type,
        // floor is optional in your shared type
        floor: (r as any).floor,
        homeId: (home?.id || "") as any,
      }));
      setRooms(newRooms);
    }
  }

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    if (!form) return;
    setForm({ ...form, [key]: val });
  }

  function parseNum(s: string): number | undefined {
    if (s === "" || s == null) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  async function save() {
    if (!home || !form) return;
    setSaving(true);
    try {
      // Build minimal patch (and avoid sending empty strings, which 400s Zod)
      const patch: Record<string, any> = {};
      if (form.nickname !== (home.nickname ?? "")) patch.nickname = form.nickname.trim();

      const sf = parseNum(form.squareFeet);
      if (sf !== (home.squareFeet ?? undefined)) patch.squareFeet = sf;

      const ls = parseNum(form.lotSize);
      if (ls !== (home.lotSize ?? undefined)) patch.lotSize = ls;

      const yb = parseNum(form.yearBuilt);
      if (yb !== (home.yearBuilt ?? undefined)) patch.yearBuilt = yb;

      if (form.architecturalStyle !== (home.architecturalStyle ?? ""))
        patch.architecturalStyle = form.architecturalStyle || undefined;

      // These exist in your API schema.ts / update.ts
      if (form.hasCentralAir !== Boolean((home as any).hasCentralAir ?? false))
        patch.hasCentralAir = form.hasCentralAir;
      if (form.hasBaseboard !== Boolean((home as any).hasBaseboard ?? false))
        patch.hasBaseboard = form.hasBaseboard;

      if (form.boilerType !== ((home as any).boilerType ?? ""))
        patch.boilerType = form.boilerType || undefined;
      if (form.roofType !== ((home as any).roofType ?? ""))
        patch.roofType = form.roofType || undefined;
      if (form.sidingType !== ((home as any).sidingType ?? ""))
        patch.sidingType = form.sidingType || undefined;

      const feats = form.featuresCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const origFeats = Array.isArray((home as any).features) ? (home as any).features : [];
      if (JSON.stringify(feats) !== JSON.stringify(origFeats)) {
        patch.features = feats;
      }

      // Do NOT send rooms here; your /homes/:id/update route doesn't accept it.

      await api.put(`/homes/${home.id}`, patch);

      toast({
        title: "Saved",
        description: "Home details were updated.",
        variant: "success",
      });

      // Refresh original so dirty tracking stays correct
      const res = await api.get<LoadedHome>(`/homes/${home.id}`);
      setHome(res.data);
    } catch (err: any) {
      console.error("[HomeEdit] save failed", err?.response?.data ?? err);
      const detail =
        err?.response?.data?.message ??
        (Array.isArray(err?.response?.data?.issues)
          ? err.response.data.issues.map((i: any) => i.message).join("; ")
          : "Please check your entries and try again.");
      toast({
        title: "Save failed",
        description: detail,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form || !home) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading home…
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Home</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/homes")}>
            Back
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Basics */}
        <section className="col-span-2 rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Basics</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nickname</Label>
              <Input
                value={form.nickname}
                onChange={(e) => setField("nickname", e.target.value)}
                placeholder="My place"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>Architectural Style</Label>
              <Select
                value={form.architecturalStyle}
                onChange={(e) => handleStyleChange(e.target.value)}
                aria-placeholder="Changing style auto-loads a default room template (you can tweak rooms below)."
              >
                <option value="">— Select —</option>
                {styleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Square Feet</Label>
              <Input
                type="number"
                value={form.squareFeet}
                onChange={(e) => setField("squareFeet", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Lot Size (acres)</Label>
              <Input
                type="number"
                value={form.lotSize}
                onChange={(e) => setField("lotSize", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Year Built</Label>
              <Input
                type="number"
                value={form.yearBuilt}
                onChange={(e) => setField("yearBuilt", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Boiler Type</Label>
              <Input
                value={form.boilerType}
                onChange={(e) => setField("boilerType", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Roof Type</Label>
              <Input
                value={form.roofType}
                onChange={(e) => setField("roofType", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Siding Type</Label>
              <Input
                value={form.sidingType}
                onChange={(e) => setField("sidingType", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Switch
                id="hasCentralAir"
                checked={form.hasCentralAir}
                onCheckedChange={(v: boolean) => setField("hasCentralAir", v)}
              />
              <Label htmlFor="hasCentralAir">Central Air</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="hasBaseboard"
                checked={form.hasBaseboard}
                onCheckedChange={(v: boolean) => setField("hasBaseboard", v)}
              />
              <Label htmlFor="hasBaseboard">Baseboard Heating</Label>
            </div>
          </div>

          <div className="mt-4">
            <Label>Features (comma-separated)</Label>
            <Input
              className="mt-2"
              value={form.featuresCsv}
              onChange={(e) => setField("featuresCsv", e.target.value)}
              placeholder="fireplace, garage, deck"
            />
          </div>
        </section>

        {/* Sidebar */}
        <aside className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Address</h2>
          <div className="text-sm text-muted-foreground">
            <div>{home.address}</div>
            <div>
              {home.city}, {home.state} {home.zip}
            </div>
          </div>

          {form.imageUrl ? (
            <div className="mt-4">
              <img
                src={form.imageUrl}
                alt="Home"
                className="h-40 w-full rounded-md object-cover"
              />
            </div>
          ) : null}
        </aside>
      </div>

      {/* Rooms view (read-only for now; server updates are on different routes) */}
      <section className="mt-6 rounded-lg border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <div className="text-xs text-muted-foreground">
            Rooms auto-load from style. Edit room details on the Rooms page (coming soon).
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No rooms yet. Pick an architectural style to load a template.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <li key={String(r.id)} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs uppercase text-muted-foreground">
                    {r.type}
                  </div>
                </div>
                {r.floor != null && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Floor: {r.floor}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
