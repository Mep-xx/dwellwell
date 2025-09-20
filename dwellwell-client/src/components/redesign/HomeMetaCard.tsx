// dwellwell-client/src/components/redesign/HomeMetaCard.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { HomeWithMeta } from "@/types/extended";

/** If you have central constants, feel free to wire those back in. */
const STYLES = [
  "Colonial","Cape Cod","Ranch","Craftsman","Contemporary","Victorian",
  "Tudor","Farmhouse","Bungalow","Split-Level","Townhouse",
];
const ROOF = ["", "Asphalt Shingle","Metal","Tile","Slate","Wood","Membrane","Composite","Other"];
const SIDING = ["", "Vinyl","Wood","Fiber Cement","Brick","Stucco","Stone","Aluminum","Composite","Other"];

type Props = { home: HomeWithMeta; onUpdated: (next: Partial<HomeWithMeta>) => void; };

type Form = {
  nickname: string; apartment: string; squareFeet: string;
  lotSize: string; yearBuilt: string; architecturalStyle: string;
  hasCentralAir: boolean; hasBaseboard: boolean; hasHeatPump: boolean;
  roofType: string; sidingType: string; features: string[];
};

export default function HomeMetaCard({ home, onUpdated }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [f, setF] = useState<Form>(() => ({
    nickname: home.nickname ?? "",
    apartment: home.apartment ?? "",
    squareFeet: home.squareFeet ? String(home.squareFeet) : "",
    lotSize: home.lotSize ? String(home.lotSize) : "",
    yearBuilt: home.yearBuilt ? String(home.yearBuilt) : "",
    architecturalStyle: home.architecturalStyle ?? "",
    hasCentralAir: !!home.hasCentralAir,
    hasBaseboard: !!home.hasBaseboard,
    hasHeatPump: !!home.hasHeatPump,
    roofType: home.roofType ?? "",
    sidingType: home.sidingType ?? "",
    features: Array.isArray(home.features) ? home.features : [],
  }));

  // free-form acres (so ".49" works while typing)
  const [acresText, setAcresText] = useState<string>("");
  useEffect(() => {
    const next: Form = {
      nickname: home.nickname ?? "",
      apartment: home.apartment ?? "",
      squareFeet: home.squareFeet ? String(home.squareFeet) : "",
      lotSize: home.lotSize ? String(home.lotSize) : "",
      yearBuilt: home.yearBuilt ? String(home.yearBuilt) : "",
      architecturalStyle: home.architecturalStyle ?? "",
      hasCentralAir: !!home.hasCentralAir,
      hasBaseboard: !!home.hasBaseboard,
      hasHeatPump: !!home.hasHeatPump,
      roofType: home.roofType ?? "",
      sidingType: home.sidingType ?? "",
      features: Array.isArray(home.features) ? home.features : [],
    };
    setF(next);
    if (next.lotSize) {
      const a = Number(next.lotSize) / 43560;
      setAcresText(Number.isFinite(a) ? String(+a.toFixed(2)) : "");
    } else setAcresText("");
  }, [home]);

  const acresDisplay = useMemo(() => {
    const n = Number(f.lotSize);
    return Number.isFinite(n) && n > 0 ? (n / 43560).toFixed(2) : "—";
  }, [f.lotSize]);

  const commitAcresToSqft = () => {
    const t = acresText.trim();
    if (!t) { setF(p => ({ ...p, lotSize: "" })); return; }
    const a = Number(t);
    if (!Number.isFinite(a) || a <= 0) return;
    const sqft = Math.round(a * 43560);
    setF(p => ({ ...p, lotSize: String(sqft) }));
    setAcresText(String(+a.toFixed(2)));
  };

  const save = async () => {
    commitAcresToSqft();
    setBusy(true);
    try {
      const payload: Partial<HomeWithMeta> = {
        nickname: f.nickname.trim() || undefined,
        apartment: f.apartment.trim() || undefined,
        architecturalStyle: f.architecturalStyle || undefined,
        roofType: f.roofType || undefined,
        sidingType: f.sidingType || undefined,
        hasCentralAir: !!f.hasCentralAir,
        hasBaseboard: !!f.hasBaseboard,
        hasHeatPump: !!f.hasHeatPump,
        features: f.features,
      };
      const sq = Number(f.squareFeet); if (Number.isFinite(sq) && sq > 0) payload.squareFeet = sq;
      const ls = Number(f.lotSize); if (Number.isFinite(ls) && ls > 0) payload.lotSize = ls;
      const yb = Number(f.yearBuilt); if (Number.isFinite(yb) && yb > 1600) payload.yearBuilt = yb;

      const { data } = await api.patch(`/homes/${home.id}`, payload);
      onUpdated(data as Partial<HomeWithMeta>);
      toast({ title: "Home details saved" });
      setEditing(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.response?.data?.message || "Could not save home details.",
        variant: "destructive",
      });
    } finally { setBusy(false); }
  };

  const addFeature = (v: string) => {
    const val = v.trim(); if (!val) return;
    setF(p => (p.features.includes(val) ? p : { ...p, features: [...p.features, val] }));
  };
  const removeFeature = (val: string) =>
    setF(p => ({ ...p, features: p.features.filter(x => x !== val) }));

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-sm font-semibold">Home details</h2>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy}>Save</Button>
          </div>
        )}
      </div>

      {/* Read mode */}
      {!editing && (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nickname" value={home.nickname || "—"} />
          <Field label="Apartment" value={home.apartment || "—"} />
          <Field label="Square feet" value={home.squareFeet?.toLocaleString?.() || "—"} />
          <Field label="Lot size (acres)" value={acresDisplay} />
          <Field label="Year built" value={home.yearBuilt || "—"} />
          <Field label="Style" value={home.architecturalStyle || "—"} />
          <Field label="Roof" value={home.roofType || "—"} />
          <Field label="Siding" value={home.sidingType || "—"} />
          <TogglePill label="Central Air" value={!!home.hasCentralAir} />
          <TogglePill label="Baseboard" value={!!home.hasBaseboard} />
          <TogglePill label="Heat Pump" value={!!home.hasHeatPump} />

          <div className="sm:col-span-2 lg:col-span-3">
            <div className="mb-1 text-xs text-muted-foreground">Features</div>
            <div className="rounded-2xl border bg-white p-3">
              {Array.isArray(home.features) && home.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {home.features.map((f) => (
                    <span key={f} className="inline-flex items-center rounded-lg border bg-white px-2.5 py-1 text-xs text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">—</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Text label="Nickname" value={f.nickname} onChange={(v) => setF(p => ({ ...p, nickname: v }))} />
          <Text label="Apartment" value={f.apartment} onChange={(v) => setF(p => ({ ...p, apartment: v }))} />
          <Int label="Square feet" value={f.squareFeet} onChange={(v) => setF(p => ({ ...p, squareFeet: v }))} />

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Lot size (acres)</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={acresText}
              onChange={(e) => setAcresText(e.target.value)}
              onBlur={commitAcresToSqft}
              placeholder="e.g. 0.49"
              inputMode="decimal"
            />
            <div className="mt-1 text-[11px] text-muted-foreground">
              Stored as square feet. Current internal value: {f.lotSize || "—"} sq ft
            </div>
          </div>

          <Int label="Year built" value={f.yearBuilt} onChange={(v) => setF(p => ({ ...p, yearBuilt: v }))} />

          <Select label="Style" value={f.architecturalStyle} onChange={(v) => setF(p => ({ ...p, architecturalStyle: v }))} options={["", ...STYLES]} />
          <Select label="Roof" value={f.roofType} onChange={(v) => setF(p => ({ ...p, roofType: v }))} options={ROOF} />
          <Select label="Siding" value={f.sidingType} onChange={(v) => setF(p => ({ ...p, sidingType: v }))} options={SIDING} />

          <Check label="Central Air" checked={f.hasCentralAir} onChange={(v) => setF(p => ({ ...p, hasCentralAir: v }))} />
          <Check label="Baseboard" checked={f.hasBaseboard} onChange={(v) => setF(p => ({ ...p, hasBaseboard: v }))} />
          <Check label="Heat Pump" checked={f.hasHeatPump} onChange={(v) => setF(p => ({ ...p, hasHeatPump: v }))} />

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs text-muted-foreground">Features (press Enter to add)</label>
            <Tags values={f.features} onAdd={addFeature} onRemove={removeFeature} placeholder="e.g. Deck, Fireplace, Pool" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small bits ---------- */

function Field({ label, value }: { label: string; value: string | number }) {
  const display = (value ?? "—") as string | number;
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="w-full rounded-xl border bg-white px-3 py-2 text-sm">{display || "—"}</div>
    </div>
  );
}

function TogglePill({ label, value }: { label: string; value: boolean }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
            value
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-gray-50 text-gray-600 border border-gray-200"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              value ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {value ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
}

function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Int({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        inputMode="numeric"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[]; }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <select
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt || "(blank)"} value={opt}>
            {opt || "—"}
          </option>
        ))}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 text-xs text-muted-foreground">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-emerald-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

function Tags({ values, onAdd, onRemove, placeholder }: { values: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder?: string; }) {
  const [text, setText] = useState("");
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (text.trim()) { onAdd(text); setText(""); }
    }
    if (e.key === "Backspace" && !text && values.length) onRemove(values[values.length - 1]);
  };
  return (
    <div className="rounded-lg border p-2 bg-white">
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-xs text-muted-foreground">
            {v}
            <button className="text-muted-foreground/70 hover:text-foreground" onClick={() => onRemove(v)} aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
        <input
          className="min-w-[160px] flex-1 px-2 py-1 text-sm outline-none"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
