import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api";
import { sanitize } from "../utils/sanitize";
import type { TrackableCategory } from "@shared/types/trackable";
import { ChevronDown, ChevronUp, X } from "lucide-react";

/** ─────────────────────────────────────────────────────────────────────────────
 *  Public types (used by parent)
 *  ────────────────────────────────────────────────────────────────────────────*/
export type CreateTrackableDTO = {
  id?: string; // present only when editing
  userDefinedName: string;
  brand?: string;
  model?: string;
  type?: string;
  category?: TrackableCategory | string;
  serialNumber?: string | null;
  imageUrl?: string;
  notes?: string | null;
  applianceCatalogId?: string;
  roomId?: string | null;
  homeId?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trackable: CreateTrackableDTO) => void; // create/update DTO
  initialData?: CreateTrackableDTO | null;
};

/** ─────────────────────────────────────────────────────────────────────────────
 *  Curated taxonomy
 *  ────────────────────────────────────────────────────────────────────────────*/
const CATEGORY_OPTIONS = [
  { value: "appliance", label: "Appliance" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "heating", label: "Heating" },
  { value: "cooling", label: "Cooling" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "outdoor", label: "Outdoor" },
  { value: "safety", label: "Safety" },
  { value: "general", label: "General" },
] as const;

const TYPE_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  appliance: [
    { value: "dishwasher", label: "Dishwasher" },
    { value: "refrigerator", label: "Refrigerator" },
    { value: "range-oven", label: "Range / Oven" },
    { value: "microwave", label: "Microwave" },
    { value: "washer", label: "Washer" },
    { value: "dryer", label: "Dryer" },
    { value: "water-heater", label: "Water Heater" },
    { value: "water-softener", label: "Water Softener" },
    { value: "dehumidifier", label: "Dehumidifier" },
  ],
  kitchen: [
    { value: "sink-faucet", label: "Sink / Faucet" },
    { value: "garbage-disposal", label: "Garbage Disposal" },
    { value: "range-hood", label: "Range Hood" },
    { value: "countertop", label: "Countertop" },
    { value: "cabinetry", label: "Cabinetry" },
  ],
  bathroom: [
    { value: "toilet", label: "Toilet" },
    { value: "shower-tub", label: "Shower / Tub" },
    { value: "bath-faucet", label: "Sink / Faucet" },
    { value: "exhaust-fan", label: "Exhaust Fan" },
    { value: "vanity", label: "Vanity / Cabinet" },
  ],
  heating: [
    { value: "furnace", label: "Furnace" },
    { value: "boiler", label: "Boiler" },
    { value: "space-heater", label: "Space Heater" },
    { value: "radiant-heat", label: "Radiant Heat" },
  ],
  cooling: [
    { value: "central-ac", label: "Central A/C" },
    { value: "heat-pump", label: "Heat Pump" },
    { value: "mini-split", label: "Mini Split" },
    { value: "window-ac", label: "Window A/C" },
  ],
  plumbing: [
    { value: "main-shutoff", label: "Main Shutoff Valve" },
    { value: "sump-pump", label: "Sump Pump" },
    { value: "well-pump", label: "Well Pump" },
    { value: "septic", label: "Septic System" },
  ],
  electrical: [
    { value: "panel", label: "Electrical Panel" },
    { value: "generator", label: "Generator" },
    { value: "smoke-co", label: "Smoke/CO Detector" },
    { value: "outlets-switches", label: "Outlets / Switches" },
  ],
  outdoor: [
    { value: "lawn-mower", label: "Lawn Mower" },
    { value: "sprinkler-system", label: "Sprinkler System" },
    { value: "grill", label: "Grill" },
    { value: "deck-patio", label: "Deck / Patio" },
    { value: "fence-gate", label: "Fence / Gate" },
  ],
  safety: [
    { value: "fire-extinguisher", label: "Fire Extinguisher" },
    { value: "alarm-system", label: "Alarm / Security System" },
    { value: "radon-system", label: "Radon Mitigation" },
  ],
  general: [
    { value: "tool", label: "Tool" },
    { value: "window", label: "Window" },
    { value: "door", label: "Door" },
    { value: "flooring", label: "Flooring" },
    { value: "paint", label: "Paint / Finish" },
    { value: "other", label: "Other" },
  ],
};

/** Appliance name → brand/model lookup result */
type ApplianceLookup = {
  brand: string;
  model: string;
  type: string;
  category: string;
  notes?: string;
  imageUrl?: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{title}</div>
      {children}
    </div>
  );
}

export default function TrackableModal({ isOpen, onClose, onSave, initialData }: Props) {
  const isEditing = Boolean(initialData?.id);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [form, setForm] = useState<CreateTrackableDTO>({
    // ❌ no id here for NEW; only present when editing
    userDefinedName: "",
    brand: "",
    model: "",
    type: "",
    category: "general",
    serialNumber: "",
    imageUrl: "",
    notes: "",
  });

  const [suggestions, setSuggestions] = useState<ApplianceLookup[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialData && initialData.id) {
      // EDIT: hydrate with id
      setForm({
        id: initialData.id,
        userDefinedName: initialData.userDefinedName ?? "",
        brand: initialData.brand ?? "",
        model: initialData.model ?? "",
        type: initialData.type ?? "",
        category: (initialData.category as TrackableCategory) ?? "general",
        serialNumber: initialData.serialNumber ?? "",
        imageUrl: initialData.imageUrl ?? "",
        notes: initialData.notes ?? "",
        applianceCatalogId: initialData.applianceCatalogId,
        roomId: initialData.roomId ?? undefined,
        homeId: initialData.homeId ?? undefined,
      });
    } else {
      resetForm();
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen && !initialData) resetForm();
  }, [isOpen, initialData]);

  const resetForm = () => {
    setForm({
      userDefinedName: "",
      type: "",
      category: "general",
      brand: "",
      model: "",
      serialNumber: "",
      imageUrl: "",
      notes: "",
    });
    setAdvancedOpen(false);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const typeOptions = useMemo(
    () => TYPE_BY_CATEGORY[`${form.category || "general"}`] ?? [],
    [form.category]
  );

  useEffect(() => {
    if (form.type && !typeOptions.some(o => o.value === form.type)) {
      setForm(prev => ({ ...prev, type: "" }));
    }
  }, [typeOptions, form.type]);

  const onField = (name: keyof CreateTrackableDTO, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Lookup by name with debounce
  const handleNameChange = (val: string) => {
    onField("userDefinedName", val);

    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (!val || val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    lookupTimer.current = setTimeout(async () => {
      try {
        // DB-first
        const res = await api.get("/lookup/appliances", { params: { q: val } });
        let results: ApplianceLookup[] = Array.isArray(res.data) ? res.data : [];
        // AI fallback
        if (!results.length) {
          const aiRes = await api.get("/ai/lookup-appliance", { params: { q: val } });
          results = Array.isArray(aiRes.data) ? aiRes.data : [];
        }
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error("Lookup failed:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 350);
  };

  const applySuggestion = (s: ApplianceLookup) => {
    setForm(prev => ({
      ...prev,
      userDefinedName: `${s.brand} ${s.model}`.trim(),
      brand: s.brand ?? "",
      model: s.model ?? "",
      type: s.type ?? prev.type,
      category: (s.category as TrackableCategory) ?? prev.category,
      notes: s.notes || prev.notes,
      imageUrl: s.imageUrl || prev.imageUrl,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.userDefinedName?.trim();
    if (!name) return;

    const cleaned: CreateTrackableDTO = {
      // For NEW, there is no id key at all. For EDIT, id is present.
      ...(isEditing ? { id: initialData!.id } : {}),
      userDefinedName: sanitize(name),
      brand: sanitize(form.brand ?? ""),
      model: sanitize(form.model ?? ""),
      serialNumber: sanitize(form.serialNumber ?? ""),
      notes: sanitize(form.notes ?? ""),
      type: form.type,
      category: form.category,
      imageUrl: form.imageUrl,
      applianceCatalogId: form.applianceCatalogId,
      roomId: form.roomId ?? undefined,
      homeId: form.homeId ?? undefined,
    };

    onSave(cleaned);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-xl p-6 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Trackable" : "Add New Trackable"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name + suggestions */}
          <Section title="Name">
            <div className="relative">
              <input
                name="userDefinedName"
                autoComplete="off"
                value={form.userDefinedName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Bosch SilencePlus Dishwasher"
                className="w-full border rounded px-3 py-2"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map((s, idx) => (
                    <li
                      key={`${s.brand}-${s.model}-${idx}`}
                      onClick={() => applySuggestion(s)}
                      className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <span className="font-medium">{s.brand}</span> {s.model}
                      {s.type ? <span className="text-gray-500"> • {s.type}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          {/* Category / Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="Category">
              <select
                name="category"
                value={String(form.category || "general")}
                onChange={(e) => onField("category", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Section>

            <Section title="Type">
              <select
                name="type"
                value={form.type ?? ""}
                onChange={(e) => onField("type", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a type…</option>
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Section>
          </div>

          {/* Brand / Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="Brand">
              <input
                name="brand"
                value={form.brand ?? ""}
                onChange={(e) => onField("brand", e.target.value)}
                placeholder="e.g., Bosch"
                className="w-full border rounded px-3 py-2"
              />
            </Section>
            <Section title="Model">
              <input
                name="model"
                value={form.model ?? ""}
                onChange={(e) => onField("model", e.target.value)}
                placeholder="e.g., SHXM63W55N"
                className="w-full border rounded px-3 py-2"
              />
            </Section>
          </div>

          {/* Advanced accordion */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-700">Advanced details</span>
              {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {advancedOpen && (
              <div className="px-3 pb-3 pt-1 space-y-4">
                <Section title="Serial Number">
                  <input
                    name="serialNumber"
                    value={form.serialNumber ?? ""}
                    onChange={(e) => onField("serialNumber", e.target.value)}
                    placeholder="Optional"
                    className="w-full border rounded px-3 py-2"
                  />
                </Section>

                <Section title="Image URL">
                  <input
                    name="imageUrl"
                    value={form.imageUrl ?? ""}
                    onChange={(e) => onField("imageUrl", e.target.value)}
                    placeholder="https://…"
                    className="w-full border rounded px-3 py-2"
                  />
                </Section>

                <Section title="Notes">
                  <textarea
                    name="notes"
                    value={form.notes ?? ""}
                    onChange={(e) => onField("notes", e.target.value)}
                    placeholder="Anything you want to remember…"
                    rows={3}
                    className="w-full border rounded px-3 py-2"
                  />
                </Section>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
            >
              {isEditing ? "Save Changes" : "Save Trackable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
