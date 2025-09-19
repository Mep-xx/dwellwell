// dwellwell-client/src/components/redesign/HomeMetaCard.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { HomeWithMeta } from "@/types/extended";

// Optional: replace with a shared list if you have one
const FALLBACK_STYLES = [
  "Colonial", "Cape Cod", "Ranch", "Craftsman", "Contemporary", "Victorian",
  "Tudor", "Farmhouse", "Bungalow", "Split-Level", "Townhouse",
];

type Props = {
  home: HomeWithMeta;
  onUpdated: (next: Partial<HomeWithMeta>) => void;
};

type FormState = {
  nickname: string;
  apartment: string;
  squareFeet: string;
  lotSize: string;
  yearBuilt: string;
  architecturalStyle: string;
  hasCentralAir: boolean;
  hasBaseboard: boolean;
  hasHeatPump: boolean;
  boilerType: string;
  roofType: string;
  sidingType: string;
  features: string[];
};

export default function HomeMetaCard({ home, onUpdated }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [styles] = useState<string[]>(FALLBACK_STYLES);

  const [f, setF] = useState<FormState>(() => ({
    nickname: home.nickname ?? "",
    apartment: home.apartment ?? "",
    squareFeet: home.squareFeet ? String(home.squareFeet) : "",
    lotSize: home.lotSize ? String(home.lotSize) : "",
    yearBuilt: home.yearBuilt ? String(home.yearBuilt) : "",
    architecturalStyle: home.architecturalStyle ?? "",
    hasCentralAir: !!home.hasCentralAir,
    hasBaseboard: !!home.hasBaseboard,
    hasHeatPump: !!home.hasHeatPump,
    boilerType: home.boilerType ?? "",
    roofType: home.roofType ?? "",
    sidingType: home.sidingType ?? "",
    features: Array.isArray(home.features) ? home.features : [],
  }));

  useEffect(() => {
    setF({
      nickname: home.nickname ?? "",
      apartment: home.apartment ?? "",
      squareFeet: home.squareFeet ? String(home.squareFeet) : "",
      lotSize: home.lotSize ? String(home.lotSize) : "",
      yearBuilt: home.yearBuilt ? String(home.yearBuilt) : "",
      architecturalStyle: home.architecturalStyle ?? "",
      hasCentralAir: !!home.hasCentralAir,
      hasBaseboard: !!home.hasBaseboard,
      hasHeatPump: !!home.hasHeatPump,
      boilerType: home.boilerType ?? "",
      roofType: home.roofType ?? "",
      sidingType: home.sidingType ?? "",
      features: Array.isArray(home.features) ? home.features : [],
    });
  }, [home]);

  const acres = useMemo(() => {
    const n = Number(f.lotSize);
    return Number.isFinite(n) && n > 0 ? (n / 43560).toFixed(2) : "";
  }, [f.lotSize]);

  const setFromAcres = (acresStr: string) => {
    const a = Number(acresStr);
    if (!Number.isFinite(a) || a <= 0) {
      setF((p) => ({ ...p, lotSize: "" }));
      return;
    }
    setF((p) => ({ ...p, lotSize: String(Math.round(a * 43560)) }));
  };

  const onSave = async () => {
    setBusy(true);
    try {
      const payload: Partial<HomeWithMeta> = {
        nickname: f.nickname.trim() || undefined,
        apartment: f.apartment.trim() || undefined,
        architecturalStyle: f.architecturalStyle || undefined,
        boilerType: f.boilerType.trim() || undefined,
        roofType: f.roofType.trim() || undefined,
        sidingType: f.sidingType.trim() || undefined,
        hasCentralAir: !!f.hasCentralAir,
        hasBaseboard: !!f.hasBaseboard,
        hasHeatPump: !!f.hasHeatPump,
        features: f.features,
      };
      const sq = Number(f.squareFeet);
      if (Number.isFinite(sq) && sq > 0) payload.squareFeet = sq;
      const ls = Number(f.lotSize);
      if (Number.isFinite(ls) && ls > 0) payload.lotSize = ls;
      const yb = Number(f.yearBuilt);
      if (Number.isFinite(yb) && yb > 1600) payload.yearBuilt = yb;

      const { data: updated } = await api.patch(`/homes/${home.id}`, payload);
      onUpdated(updated as Partial<HomeWithMeta>);
      toast({ title: "Home details saved" });
      setEditing(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.response?.data?.message || "Could not save home details.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const addFeature = (val: string) => {
    const v = val.trim();
    if (!v) return;
    setF((p) => (p.features.includes(v) ? p : { ...p, features: [...p.features, v] }));
  };
  const removeFeature = (val: string) =>
    setF((p) => ({ ...p, features: p.features.filter((x) => x !== val) }));

  return (
    <div className="rounded-2xl border bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-sm font-semibold">Home details</h2>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={busy}>
              Save
            </Button>
          </div>
        )}
      </div>

      {!editing && (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nickname" value={home.nickname || "—"} />
          <Field label="Apartment" value={home.apartment || "—"} />
          <Field label="Square feet" value={home.squareFeet?.toLocaleString?.() || "—"} />
          <Field label="Lot size (acres)" value={home.lotSize ? (home.lotSize / 43560).toFixed(2) : "—"} />
          <Field label="Year built" value={home.yearBuilt || "—"} />
          <Field label="Style" value={home.architecturalStyle || "—"} />
          <Field label="Boiler" value={home.boilerType || "—"} />
          <Field label="Roof" value={home.roofType || "—"} />
          <Field label="Siding" value={home.sidingType || "—"} />
          <ToggleView label="Central Air" value={!!home.hasCentralAir} />
          <ToggleView label="Baseboard" value={!!home.hasBaseboard} />
          <ToggleView label="Heat Pump" value={!!home.hasHeatPump} />
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="mb-1.5 text-xs text-muted-foreground">Features</div>
            {Array.isArray(home.features) && home.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {home.features.map((f) => (
                  <span key={f} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">{f}</span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextInput label="Nickname" value={f.nickname} onChange={(v) => setF((p) => ({ ...p, nickname: v }))} />
          <TextInput label="Apartment" value={f.apartment} onChange={(v) => setF((p) => ({ ...p, apartment: v }))} />
          <NumberInput label="Square feet" value={f.squareFeet} onChange={(v) => setF((p) => ({ ...p, squareFeet: v }))} />
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Lot size (acres)</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={acres}
              onChange={(e) => setFromAcres(e.target.value)}
              placeholder="e.g. 0.25"
              inputMode="decimal"
            />
            <div className="mt-1 text-[11px] text-muted-foreground">
              Stored internally as square feet. Current: {f.lotSize || "—"} sq ft
            </div>
          </div>
          <NumberInput label="Year built" value={f.yearBuilt} onChange={(v) => setF((p) => ({ ...p, yearBuilt: v }))} />
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Style</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={f.architecturalStyle}
              onChange={(e) => setF((p) => ({ ...p, architecturalStyle: e.target.value }))}
            >
              <option value="">—</option>
              {styles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <TextInput label="Boiler" value={f.boilerType} onChange={(v) => setF((p) => ({ ...p, boilerType: v }))} />
          <TextInput label="Roof" value={f.roofType} onChange={(v) => setF((p) => ({ ...p, roofType: v }))} />
          <TextInput label="Siding" value={f.sidingType} onChange={(v) => setF((p) => ({ ...p, sidingType: v }))} />
          <ToggleRow label="Central Air" checked={f.hasCentralAir} onChange={(v) => setF((p) => ({ ...p, hasCentralAir: v }))} />
          <ToggleRow label="Baseboard" checked={f.hasBaseboard} onChange={(v) => setF((p) => ({ ...p, hasBaseboard: v }))} />
          <ToggleRow label="Heat Pump" checked={f.hasHeatPump} onChange={(v) => setF((p) => ({ ...p, hasHeatPump: v }))} />
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs text-muted-foreground">Features (press Enter to add)</label>
            <TagInput values={f.features} onAdd={addFeature} onRemove={removeFeature} placeholder="e.g. Deck, Fireplace, Pool" />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value || "—"}</div>
    </div>
  );
}
function ToggleView({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 text-xs text-muted-foreground">{label}</span>
      <Switch checked={value} disabled />
    </div>
  );
}
function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
function NumberInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} placeholder={placeholder} inputMode="numeric" />
    </div>
  );
}
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
function TagInput({ values, onAdd, onRemove, placeholder }: { values: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder?: string; }) {
  const [text, setText] = useState("");
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (text.trim()) { onAdd(text); setText(""); }
    }
    if (e.key === "Backspace" && !text && values.length) onRemove(values[values.length - 1]);
  };
  return (
    <div className="rounded-lg border p-2">
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground">
            {v}
            <button className="text-muted-foreground/70 hover:text-foreground" onClick={() => onRemove(v)} aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
        <input className="min-w-[160px] flex-1 px-2 py-1 text-sm outline-none" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} />
      </div>
    </div>
  );
}
