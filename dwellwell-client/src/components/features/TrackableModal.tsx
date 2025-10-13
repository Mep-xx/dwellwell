// dwellwell-client/src/components/features/TrackableModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/utils/api";
import { sanitize } from "@/utils/sanitize";
import type { TrackableCategory } from "@shared/types/trackable";
import type { Room } from "@shared/types/room";
import Combobox from "@/components/ui/Combobox";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { CATEGORY_OPTIONS, TYPE_BY_CATEGORY } from "@shared/constants/trackables";
import { normalizeType, normalizeCategory, getTypeLabel, } from "@shared/constants/trackables";

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
  productUrl?: string | null;
  manualUrl?: string | null;
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
  matchedCatalogId?: string | null;
};

type HomeLite = {
  id: string;
  nickname?: string | null;
  address: string;
  city: string;
  state: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-body">{title}</div>
      {children}
    </div>
  );
}

/** tiny helper to show transient “activity” */
function Activity({ text }: { text: string }) {
  return (
    <div className="mb-4 rounded-lg border border-token bg-surface-alt px-4 py-3 text-sm">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[rgb(var(--primary))] animate-pulse" />
        {text}
      </span>
    </div>
  );
}

export default function TrackableModal({ isOpen, onClose, onSave, initialData }: Props) {
  const isEditing = Boolean(initialData?.id);

  // form
  const [form, setForm] = useState<CreateTrackableDTO>({
    userDefinedName: "",
    brand: "",
    model: "",
    type: "",
    category: "general",
    serialNumber: "",
    imageUrl: "",
    notes: "",
    productUrl: "",
    manualUrl: "",
  });

  // lists
  const [homes, setHomes] = useState<HomeLite[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homesLoading, setHomesLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // lookups
  const [suggestions, setSuggestions] = useState<ApplianceLookup[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // activity/status
  const [activity, setActivity] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // celebration
  const [celebrate, setCelebrate] = useState<{ name: string; tasks?: number } | null>(null);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const typeOptions = useMemo(
    () => TYPE_BY_CATEGORY[String(form.category || "general")] ?? [],
    [form.category]
  );

  useEffect(() => {
    if (form.type && !typeOptions.some((o) => o.value === form.type)) {
      setForm((prev) => ({ ...prev, type: "" }));
    }
  }, [typeOptions, form.type]);

  const onField = (name: keyof CreateTrackableDTO, value: any) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  // hydrate + reset
  useEffect(() => {
    if (!isOpen) return;
    setCelebrate(null);
    setActivity(null);
    setAdvancedOpen(false);
    setSuggestions([]);
    setShowSuggestions(false);

    if (initialData?.id) {
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
        productUrl: initialData.productUrl ?? "",
        manualUrl: initialData.manualUrl ?? "",
      });
    } else {
      setForm({
        userDefinedName: "",
        brand: "",
        model: "",
        type: "",
        category: "general",
        serialNumber: "",
        imageUrl: "",
        notes: "",
        productUrl: "",
        manualUrl: "",
      });
    }
  }, [isOpen, initialData]);

  // load homes
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setHomesLoading(true);
      try {
        const res = await api.get("/homes", { params: { mine: 1, limit: 500 } }).catch(() => ({ data: [] }));
        if (cancelled) return;
        const list: HomeLite[] = Array.isArray(res.data) ? res.data : [];
        setHomes(list);
        const preferred =
          (initialData?.homeId && list.find(h => h.id === initialData.homeId)) ||
          list[0] || null;
        setForm(prev => ({ ...prev, homeId: prev.homeId ?? preferred?.id ?? prev.homeId }));
      } finally {
        if (!cancelled) setHomesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, initialData?.homeId]);

  // load rooms for selected home
  useEffect(() => {
    if (!isOpen) return;
    const hid = form.homeId;
    let cancelled = false;

    if (!hid) {
      setRooms([]);
      setRoomsLoading(false);
      setForm(prev => ({ ...prev, roomId: undefined }));
      return;
    }

    (async () => {
      setRoomsLoading(true);
      try {
        const res = await api.get("/rooms", { params: { homeId: hid, includeDetails: false, limit: 1000 } });
        if (cancelled) return;
        const list: Room[] = Array.isArray(res.data) ? res.data : [];
        setRooms(list);
        if (form.roomId && !list.some(r => r.id === form.roomId)) {
          setForm(prev => ({ ...prev, roomId: undefined }));
        }
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, form.homeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // name → lookup (catalog then AI, with live activity)
  const catalogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLUListElement | null>(null);

  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
    setActivity(null);
    if (catalogTimer.current) clearTimeout(catalogTimer.current);
    if (aiTimer.current) clearTimeout(aiTimer.current);
  };

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(t) &&
        inputRef.current &&
        !inputRef.current.contains(t)
      ) closeSuggestions();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSuggestions(); };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

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

    // Catalog after short debounce
    catalogTimer.current = setTimeout(async () => {
      try {
        setActivity("Looking through catalog…");
        const res = await api.get("/lookup/appliances", { params: { q } });
        if (lastQueryRef.current !== q) return;
        const cat: ApplianceLookup[] = Array.isArray(res.data) ? res.data : [];

        setSuggestions(cat);
        setShowSuggestions(cat.length > 0);

        if (cat.length === 0) {
          // AI after a pause
          aiTimer.current = setTimeout(async () => {
            try {
              if (lastQueryRef.current !== q) return;
              setActivity("Querying AI…");
              // NOTE: if your API exposes a different route, change here:
              // e.g. "/lookup/appliances/ai"
              const aiRes = await api.get("/ai/lookup-appliance", { params: { q } });
              if (lastQueryRef.current !== q) return;
              const ai = Array.isArray(aiRes.data) ? aiRes.data : [];
              setSuggestions(ai);
              setShowSuggestions(ai.length > 0);
            } catch {
              // AI may not be available — just hide the activity and leave suggestions empty.
            } finally {
              setActivity(null);
            }
          }, 800);
        } else {
          setActivity(null);
        }
      } catch {
        setActivity(null);
      }
    }, 350);
  };

  const applySuggestion = (s: ApplianceLookup) => {
    const normType = normalizeType(s.type);
    const normCat = normalizeCategory(s.category);
    setForm((prev) => ({
      ...prev,
      userDefinedName: `${s.brand} ${s.model}`.trim(),
      brand: s.brand ?? "",
      model: s.model ?? "",
      type: normType || prev.type,
      category: (normCat as TrackableCategory) ?? prev.category,
      notes: s.notes || prev.notes,
      imageUrl: s.imageUrl || prev.imageUrl,
      applianceCatalogId: s.matchedCatalogId ?? prev.applianceCatalogId,
    }));
    closeSuggestions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const name = (form.userDefinedName || "").trim();
    if (!name) return;

    setSubmitting(true);

    // fold product/manual urls into notes until API has first-class fields
    const addl: string[] = [];
    if (form.productUrl?.trim()) addl.push(`Product: ${form.productUrl.trim()}`);
    if (form.manualUrl?.trim()) addl.push(`Manual: ${form.manualUrl.trim()}`);
    const mergedNotes = [form.notes?.trim() || "", ...addl].filter(Boolean).join("\n");

    // ✅ normalize category/type just before save
    const normCat = normalizeCategory(String(form.category || "general"));
    const normType = normalizeType(form.type || "");

    const cleaned: CreateTrackableDTO = {
      ...(isEditing ? { id: form.id } : {}),
      userDefinedName: sanitize(name),
      brand: sanitize(form.brand ?? ""),
      model: sanitize(form.model ?? ""),
      serialNumber: sanitize(form.serialNumber ?? ""),
      notes: sanitize(mergedNotes),
      type: normType || undefined,
      category: normCat,
      imageUrl: form.imageUrl,
      roomId: form.roomId ?? undefined,
      homeId: form.homeId ?? undefined,
      applianceCatalogId: form.applianceCatalogId,
    };

    let trackableId: string | undefined;

    try {
      if (isEditing && cleaned.id) {
        const r = await api.put(`/trackables/${cleaned.id}`, {
          userDefinedName: cleaned.userDefinedName,
          brand: cleaned.brand || null,
          model: cleaned.model || null,
          kind: cleaned.type || null,
          category: cleaned.category || null,
          serialNumber: cleaned.serialNumber || null,
          notes: cleaned.notes || null,
          imageUrl: cleaned.imageUrl || null,
          roomId: cleaned.roomId ?? null,
          homeId: cleaned.homeId ?? null,
          applianceCatalogId: cleaned.applianceCatalogId ?? null,
        });
        trackableId = r.data?.id || cleaned.id;
      } else {
        // Try to link/create catalog
        let applianceCatalogId = cleaned.applianceCatalogId;
        if (!applianceCatalogId && (cleaned.brand?.trim() || "") && (cleaned.model?.trim() || "")) {
          try {
            const fo = await api.post("/catalog/find-or-create", {
              brand: cleaned.brand!.trim(),
              model: cleaned.model!.trim(),
              type: cleaned.type || undefined,
              category: cleaned.category || undefined,
              imageUrl: cleaned.imageUrl || undefined,
              notes: cleaned.notes || undefined,
            });
            applianceCatalogId = fo.data?.catalog?.id;
          } catch {/* ignore catalog errors */ }
        }

        const res = await api.post("/trackables", {
          userDefinedName: cleaned.userDefinedName,
          homeId: cleaned.homeId ?? undefined,
          roomId: cleaned.roomId ?? undefined,
          applianceCatalogId,
          brand: cleaned.brand || undefined,
          model: cleaned.model || undefined,
          type: cleaned.type || undefined,
          category: cleaned.category || undefined,
          serialNumber: cleaned.serialNumber || undefined,
          notes: cleaned.notes || undefined,
          imageUrl: cleaned.imageUrl || undefined,
        });
        trackableId = res.data?.id;
      }

      // “Generating tasks…”
      setActivity("Generating tasks…");

      // We don’t know your exact seeding route; two safe ways:
      //   1) If the backend auto-seeds, simply wait a breath then count tasks.
      //   2) If you expose an explicit seed endpoint, call it here.
      await new Promise((r) => setTimeout(r, 600));

      // Count tasks for the celebration message (best-effort)
      let count: number | undefined = undefined;
      if (trackableId) {
        try {
          const tl = await api.get("/tasks", {
            params: { trackableId, includeCompleted: 0, includeArchived: 0, limit: 500 },
          });
          const list = Array.isArray(tl.data)
            ? tl.data
            : Array.isArray(tl.data?.items)
              ? tl.data.items
              : Array.isArray(tl.data?.tasks)
                ? tl.data.tasks
                : [];
          count = list.length;
        } catch {/* ignore */ }
      }

      setActivity(null);
      setCelebrate({ name, tasks: count });
      onSave(cleaned);
    } catch (err) {
      console.error("Save failed", err);
      setActivity(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const homeLabel = (h: HomeLite) =>
    h.nickname?.trim() || `${h.address}, ${h.city}, ${h.state}`;

  // Celebration screen replaces the form after success
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-card text-body rounded-xl w-full max-w-md p-6 shadow-lg relative border border-token text-center">
          <button onClick={onClose} className="absolute top-3 right-3 text-muted hover:text-body" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-xl font-semibold">Trackable added</h2>
          <p className="mt-1">
            <span className="font-medium">{celebrate.name}</span> is now being tracked.
          </p>
          {typeof celebrate.tasks === "number" && (
            <p className="mt-1 text-muted">
              We added <span className="font-semibold text-body">{celebrate.tasks}</span> maintenance task{celebrate.tasks === 1 ? "" : "s"} to keep it in great shape.
            </p>
          )}
          <div className="mt-4">
            <button
              className="px-4 py-2 bg-primary text-on-primary rounded hover:opacity-90"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card text-body rounded-xl w-full max-w-xl p-6 shadow-lg relative border border-token">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted hover:text-body" aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-3">
          {isEditing ? "Edit Trackable" : "Add New Trackable"}
        </h2>

        {activity ? <Activity text={activity} /> : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Name">
            <div className="relative">
              <input
                ref={inputRef}
                name="userDefinedName"
                autoComplete="off"
                value={form.userDefinedName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setTimeout(closeSuggestions, 100)}
                placeholder="e.g., Bosch SilencePlus Dishwasher, Samsung Crystal UHD U8000F TV"
                className="w-full border border-token bg-card text-body rounded px-3 py-2"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  className="absolute z-10 bg-card text-body border border-token rounded shadow w-full mt-1 max-h-48 overflow-y-auto"
                >
                  {suggestions.map((s, idx) => (
                    <li
                      key={`${s.brand}-${s.model}-${idx}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySuggestion(s)}
                      className="p-2 hover:bg-surface-alt cursor-pointer text-sm"
                    >
                      <span className="font-medium">{s.brand}</span> {s.model}
                      {s.type ? (
                        <span className="text-muted"> • {getTypeLabel(normalizeType(s.type))}</span>
                      ) : null}
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
                className="w-full border border-token bg-card text-body rounded px-3 py-2"
                disabled={homesLoading}
              >
                <option value="">{homesLoading ? "Loading homes…" : "No home"}</option>
                {homes.map((h) => (
                  <option key={h.id} value={h.id}>{homeLabel(h)}</option>
                ))}
              </select>

              <select
                value={form.roomId ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value || undefined }))}
                className="w-full border border-token bg-card text-body rounded px-3 py-2"
                disabled={!form.homeId || roomsLoading}
              >
                <option value="">
                  {!form.homeId ? "Select a home first" : roomsLoading ? "Loading rooms…" : "(No room)"}
                </option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            {!!form.homeId && !roomsLoading && rooms.length === 0 && (
              <div className="mt-1 text-[11px] text-muted">
                No rooms in this home yet. Add rooms from the Home → Rooms tab.
              </div>
            )}
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="Category">
              <select
                name="category"
                value={String(form.category || "general")}
                onChange={(e) => onField("category", e.target.value)}
                className="w-full border border-token bg-card text-body rounded px-3 py-2"
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
                className="w-full border border-token bg-card text-body rounded px-3 py-2"
              />
            </Section>
            <Section title="Model">
              <input
                name="model"
                value={form.model ?? ""}
                onChange={(e) => onField("model", e.target.value)}
                placeholder="e.g., UN55U8000F, SHXM63W55N, X90K"
                className="w-full border border-token bg-card text-body rounded px-3 py-2"
              />
            </Section>
          </div>

          <div className="border border-token rounded-lg">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="font-medium text-body">Advanced details</span>
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
                    className="w-full border border-token bg-card text-body rounded px-3 py-2"
                  />
                </Section>

                <Section title="Image URL">
                  <input
                    name="imageUrl"
                    value={form.imageUrl ?? ""}
                    onChange={(e) => onField("imageUrl", e.target.value)}
                    placeholder="https://…"
                    className="w-full border border-token bg-card text-body rounded px-3 py-2"
                  />
                </Section>

                <Section title="Notes">
                  <textarea
                    name="notes"
                    value={form.notes ?? ""}
                    onChange={(e) => onField("notes", e.target.value)}
                    placeholder="Anything you want to remember…"
                    rows={3}
                    className="w-full border border-token bg-card text-body rounded px-3 py-2"
                  />
                </Section>

                <Section title="Product Page URL">
                  <input
                    name="productUrl"
                    value={form.productUrl ?? ""}
                    onChange={(e) => onField("productUrl", e.target.value)}
                    placeholder="https://manufacturer.com/your-product"
                    className="w-full border border-token bg-card text-body rounded px-3 py-2"
                  />
                </Section>

                <Section title="Manual (PDF) URL">
                  <input
                    name="manualUrl"
                    value={form.manualUrl ?? ""}
                    onChange={(e) => onField("manualUrl", e.target.value)}
                    placeholder="https://manufacturer.com/manual.pdf"
                    className="w-full border border-token bg-card text-body rounded px-3 py-2"
                  />
                </Section>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-token rounded text-muted hover:bg-surface-alt"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-on-primary rounded hover:opacity-90 disabled:opacity-60"
            >
              {isEditing ? "Save Changes" : "Save Trackable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
