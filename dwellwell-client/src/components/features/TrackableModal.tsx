//dwellwell-client/src/components/features/TrackableModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/utils/api";
import { sanitize } from "@/utils/sanitize";
import type { TrackableCategory } from "@shared/types/trackable";
import type { Room } from "@shared/types/room";
import Combobox from "@/components/ui/Combobox";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  CATEGORY_OPTIONS,
  TYPE_BY_CATEGORY,
} from "@shared/constants/trackables";

/** Public DTO */
export type CreateTrackableDTO = {
  id?: string;
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
  onSave: (trackable: CreateTrackableDTO) => void;
  initialData?: CreateTrackableDTO | null;
};

type ApplianceLookup = {
  brand: string;
  model: string;
  type: string;
  category: string;
  notes?: string;
  imageUrl?: string;
  matchedCatalogId?: string | null; // optional from AI endpoint
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<CreateTrackableDTO>({
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
  const [phase, setPhase] = useState<'idle' | 'catalog' | 'ai' | 'done'>('idle');
  const [submitting, setSubmitting] = useState(false);

  // taxonomy
  const typeOptions = useMemo(
    () => TYPE_BY_CATEGORY[String(form.category || "general")] ?? [],
    [form.category]
  );

  useEffect(() => {
    if (form.type && !typeOptions.some((o) => o.value === form.type)) {
      setForm((prev) => ({ ...prev, type: "" }));
    }
  }, [typeOptions, form.type]);

  const onField = (name: keyof CreateTrackableDTO, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // hydrate on open / edit
  useEffect(() => {
    if (initialData && initialData.id) {
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
    } else if (isOpen) {
      setForm({
        userDefinedName: "",
        brand: "",
        model: "",
        type: "",
        category: "general",
        serialNumber: "",
        imageUrl: "",
        notes: "",
      });
      setAdvancedOpen(false);
      setSuggestions([]);
      setShowSuggestions(false);
      setPhase("idle");
    }
  }, [isOpen, initialData]);

  // —— Debounced lookup (catalog fast; AI slower) ——
  const catalogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLUListElement | null>(null);

  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
    setPhase("idle");
  };

  // Clear timers on unmount or when modal closes to prevent setState-after-unmount
  useEffect(() => {
    if (!isOpen) {
      // modal just closed: clear timers and any open dropdown
      if (catalogTimer.current) clearTimeout(catalogTimer.current);
      if (aiTimer.current) clearTimeout(aiTimer.current);
      closeSuggestions();
    }
    return () => {
      if (catalogTimer.current) clearTimeout(catalogTimer.current);
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, [isOpen]);

  // click-outside & ESC & blur
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        closeSuggestions();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSuggestions();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const hid = initialData?.homeId;
    if (!isOpen || !hid) { setRooms([]); return; }
    (async () => {
      try {
        const res = await api.get("/rooms", { params: { homeId: hid, includeDetails: false } });
        setRooms(Array.isArray(res.data) ? res.data : []);
      } catch { setRooms([]); }
    })();
  }, [isOpen, initialData?.homeId]);

  // when opening for a specific room, ensure it sticks
  useEffect(() => {
    if (!isOpen) return;
    if (initialData?.roomId) {
      setForm((prev) => ({ ...prev, roomId: initialData.roomId, homeId: initialData.homeId ?? prev.homeId }));
    } else if (initialData?.homeId) {
      setForm((prev) => ({ ...prev, homeId: initialData.homeId, roomId: prev.roomId ?? undefined }));
    }
  }, [isOpen, initialData?.roomId, initialData?.homeId]);

  const handleNameChange = (val: string) => {
    onField("userDefinedName", val);

    if (catalogTimer.current) clearTimeout(catalogTimer.current);
    if (aiTimer.current) clearTimeout(aiTimer.current);

    const q = val.trim();
    lastQueryRef.current = q;

    if (!q || q.length < 3) {
      closeSuggestions();
      return;
    }

    // 1) Catalog pass after ~420ms calm period
    catalogTimer.current = setTimeout(async () => {
      try {
        setPhase("catalog");
        const res = await api.get("/lookup/appliances", { params: { q } });
        if (lastQueryRef.current !== q) return; // user typed again
        const cat: ApplianceLookup[] = Array.isArray(res.data) ? res.data : [];

        setSuggestions(cat);
        setShowSuggestions(cat.length > 0);

        // 2) Only try AI if catalog empty, after ~1200ms of quiet
        if (cat.length === 0) {
          aiTimer.current = setTimeout(async () => {
            try {
              if (lastQueryRef.current !== q) return;
              setPhase("ai");
              const aiRes = await api.get("/ai/lookup-appliance", { params: { q } });
              if (lastQueryRef.current !== q) return;
              const ai = Array.isArray(aiRes.data) ? aiRes.data : [];
              setSuggestions(ai);
              setShowSuggestions(ai.length > 0);
              setPhase("done");
            } catch {
              setPhase("done");
            }
          }, 1200);
        } else {
          setPhase("done");
        }
      } catch {
        setPhase("done");
      }
    }, 420);
  };

  const applySuggestion = (s: ApplianceLookup) => {
    setForm((prev) => ({
      ...prev,
      userDefinedName: `${s.brand} ${s.model}`.trim(),
      brand: s.brand ?? "",
      model: s.model ?? "",
      type: s.type ?? prev.type,
      category: (s.category as TrackableCategory) ?? prev.category,
      notes: s.notes || prev.notes,
      imageUrl: s.imageUrl || prev.imageUrl,
      applianceCatalogId: s.matchedCatalogId ?? prev.applianceCatalogId,
    }));
    closeSuggestions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const name = form.userDefinedName?.trim();
    if (!name) {
      setSubmitting(false);
      return;
    }

    const cleaned: CreateTrackableDTO = {
      ...(isEditing ? { id: form.id } : {}),
      userDefinedName: sanitize(name),
      brand: sanitize(form.brand ?? ""),
      model: sanitize(form.model ?? ""),
      serialNumber: sanitize(form.serialNumber ?? ""),
      notes: sanitize(form.notes ?? ""),
      type: form.type,
      category: form.category,
      imageUrl: form.imageUrl,
      roomId: form.roomId ?? undefined,
      homeId: form.homeId ?? undefined,
      applianceCatalogId: form.applianceCatalogId,
    };

    try {
      if (isEditing && cleaned.id) {
        await api.put(`/trackables/${cleaned.id}`, {
          userDefinedName: cleaned.userDefinedName,
          brand: cleaned.brand || null,
          model: cleaned.model || null,
          kind: cleaned.type || null,        // UI "type" → DB "kind"
          category: cleaned.category || null,
          serialNumber: cleaned.serialNumber || null,
          notes: cleaned.notes || null,
          imageUrl: cleaned.imageUrl || null,
          roomId: cleaned.roomId ?? null,
          homeId: cleaned.homeId ?? null,
          applianceCatalogId: cleaned.applianceCatalogId ?? null,
        });
      } else {
        // If brand+model present, try to link to / create catalog entry
        let applianceCatalogId = cleaned.applianceCatalogId;
        if (!applianceCatalogId && (cleaned.brand?.trim() || "") && (cleaned.model?.trim() || "")) {
          const fo = await api.post("/catalog/find-or-create", {
            brand: cleaned.brand!.trim(),
            model: cleaned.model!.trim(),
            type: cleaned.type || undefined,
            category: cleaned.category || undefined,
            imageUrl: cleaned.imageUrl || undefined,
            notes: cleaned.notes || undefined,
          });
          applianceCatalogId = fo.data?.id;
        }

        // Send overrides to /trackables so brand/model/type/category persist on the item
        await api.post("/trackables", {
          userDefinedName: cleaned.userDefinedName,
          homeId: cleaned.homeId ?? undefined,
          roomId: cleaned.roomId ?? undefined,
          applianceCatalogId,
          brand: cleaned.brand || undefined,
          model: cleaned.model || undefined,
          type: cleaned.type || undefined,        // backend maps to kind
          category: cleaned.category || undefined,
          serialNumber: cleaned.serialNumber || undefined,
          notes: cleaned.notes || undefined,
          imageUrl: cleaned.imageUrl || undefined,
        });
      }

      onSave(cleaned);
      onClose();
    } catch (err) {
      console.error("Save failed", err);
    }
    finally {
      setSubmitting(false);
    }
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

        <h2 className="text-xl font-semibold mb-2">
          {isEditing ? "Edit Trackable" : "Add New Trackable"}
        </h2>

        <div className="min-h-[22px] mb-2 text-xs text-gray-500">
          {phase === "catalog" && <span>Searching catalog…</span>}
          {phase === "ai" && <span>No catalog match — querying AI…</span>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Name">
            <div className="relative">
              <input
                ref={inputRef}
                name="userDefinedName"
                autoComplete="off"
                value={form.userDefinedName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setTimeout(closeSuggestions, 100)} // let click land
                placeholder="e.g., Bosch SilencePlus Dishwasher, Samsung Crystal UHD U8000F TV"
                className="w-full border rounded px-3 py-2"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-48 overflow-y-auto"
                >
                  {suggestions.map((s, idx) => (
                    <li
                      key={`${s.brand}-${s.model}-${idx}`}
                      onMouseDown={(e) => e.preventDefault()}
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

          <Section title="Location">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={form.homeId ?? ""}
                onChange={(e) => {
                  const hid = e.target.value || undefined;
                  setForm((p) => ({ ...p, homeId: hid, roomId: undefined }));
                }}
                className="w-full border rounded px-3 py-2"
              >
                {/* single home context—lock to current home if provided */}
                {form.homeId ? (
                  <option value={form.homeId}>This Home</option>
                ) : (
                  <option value="">No home</option>
                )}
              </select>

              <select
                value={form.roomId ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value || undefined }))}
                className="w-full border rounded px-3 py-2"
                disabled={!form.homeId}
              >
                <option value="">(No room)</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </Section>

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
              <Combobox
                aria-label="Trackable type"
                options={typeOptions}
                value={form.type ?? ""}
                onChange={(val) => onField("type", val)}
                placeholder="Search types…"
                allowCustom
              />
            </Section>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="Brand">
              <input
                name="brand"
                value={form.brand ?? ""}
                onChange={(e) => onField("brand", e.target.value)}
                placeholder="e.g., Samsung, Bosch, Apple"
                className="w-full border rounded px-3 py-2"
              />
            </Section>
            <Section title="Model">
              <input
                name="model"
                value={form.model ?? ""}
                onChange={(e) => onField("model", e.target.value)}
                placeholder="e.g., UN55U8000F, SHXM63W55N, X90K"
                className="w-full border rounded px-3 py-2"
              />
            </Section>
          </div>

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

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600 disabled:opacity-60">
              {isEditing ? "Save Changes" : "Save Trackable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
