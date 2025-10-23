// dwellwell-client/src/pages/admin/AdminApplianceModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_OPTIONS,
  TYPE_BY_CATEGORY,
  normalizeType,
  normalizeCategory,
  getTypeLabel,
} from "@shared/constants/trackables";
import {
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Loader2,
  CircleAlert,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ----------------------------- Types -------------------------------- */

type LinkedTemplate = {
  id?: string;
  title?: string;
  description?: string | null;
  recurrenceInterval?: string | null;
  [k: string]: any;
};

export type AdminApplianceRow = {
  id: string;
  brand: string;
  model: string;
  type: string | null;
  category: string | null;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  trackablesCount: number;
  linkedTemplates: LinkedTemplate[];
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  row?: AdminApplianceRow | null;
  onClose: (refetch?: boolean) => void;
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

type EnrichPreview = {
  summary?: string;
  created?: LinkedTemplate[];
  updated?: LinkedTemplate[];
  skipped?: LinkedTemplate[];
  seededTasks?: number;
  raw?: any;
};

type GenStepKey = "ai" | "found" | "generate" | "save" | "done";
type GenStatus = "idle" | "progress" | "success" | "error";
type GenStep = { key: GenStepKey; label: string; status: GenStatus; detail?: string };

/* ----------------------------- Small UI bits ------------------------ */

function LinearProgress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-1.5 w-full rounded bg-muted/40 overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
    >
      <motion.div
        className="h-full bg-[rgb(var(--primary))]"
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}

/* ----------------------------- Helpers (normalization) -------------- */

function toArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v === null || v === undefined) return [];
  return [v as T];
}

/** Try hard to extract templates no matter how the AI/API shapes them */
function extractTemplates(raw: any): {
  created: LinkedTemplate[];
  updated: LinkedTemplate[];
  skipped: LinkedTemplate[];
  numericTotal?: number;
} {
  if (!raw) return { created: [], updated: [], skipped: [], numericTotal: 0 };

  const arr = (x: any) => (Array.isArray(x) ? x : x ? [x] : []);

  let created = arr(raw.created ?? raw.tasksCreated ?? raw.new ?? raw.added);
  let updated = arr(raw.updated ?? raw.tasksUpdated ?? raw.changed);
  let skipped = arr(raw.skipped ?? raw.tasksSkipped ?? raw.unchanged);

  // alternates
  const altList =
    arr(raw.templates) ||
    arr(raw.items) ||
    arr(raw.proposed) ||
    arr(raw.result?.templates) ||
    arr(raw.result?.items) ||
    arr(raw.linkedTemplates); // support { linkedTemplates: [...] }

  if (!created.length && altList.length) created = altList;

  // single object fallbacks
  if (!created.length && (raw.template || raw.taskTemplate)) {
    created = arr(raw.template ?? raw.taskTemplate);
  }

  const tidy = (list: any[]) =>
    list.map((t: any) => ({
      ...t,
      title: t?.title || t?.name || t?.meta?.title || "Untitled task",
      recurrenceInterval: t?.recurrenceInterval ?? t?.frequency ?? null,
    }));

  // numeric only responses (e.g., { linked: 4 })
  const numericTotal =
    Number(raw?.linked) ||
    Number(raw?.templatesSaved) ||
    Number(raw?.totalTemplates) ||
    Number(raw?.createdCount) ||
    Number(raw?.count) ||
    Number(raw?.result?.savedTemplates) ||
    Number(raw?.result?.count) ||
    undefined;

  return { created: tidy(created), updated: tidy(updated), skipped: tidy(skipped), numericTotal };
}

function normalizePreview(raw: any): EnrichPreview {
  if (Array.isArray(raw)) {
    return { created: raw as LinkedTemplate[], updated: [], skipped: [], seededTasks: 0, raw };
  }

  const { created, updated, skipped, numericTotal } = extractTemplates(raw);
  const seeded =
    Number(raw?.seeded) ||
    Number(raw?.seededTasks) ||
    Number(raw?.userTasksSeeded) ||
    Number(raw?.tasksSeeded) ||
    Number(raw?.result?.seededTasks) ||
    0;

  const summaryTotal = numericTotal ?? created.length + updated.length + skipped.length;

  return {
    summary:
      raw?.summary ?? `Created ${created.length}, updated ${updated.length}, skipped ${skipped.length}.`,
    created,
    updated,
    skipped,
    seededTasks: seeded,
    raw: { ...raw, __summaryTotal: summaryTotal },
  };
}

/** Poll for tasks seeded by this catalog; best-effort count */
async function pollForSeededCount(
  catalogId: string,
  templateIds: string[],
  attempts = 5,
  delayMs = 650
): Promise<number> {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const tryGet = async (path: string, params?: any) => {
    try {
      const r = await api.get(path, params ? { params } : undefined);
      const items = Array.isArray(r.data?.items)
        ? r.data.items
        : Array.isArray(r.data)
        ? r.data
        : [];
      return items.length || 0;
    } catch {
      return 0;
    }
  };

  // 1) By catalogId
  for (let i = 0; i < attempts; i++) {
    const n = await tryGet(`/tasks`, { catalogId, includeArchived: 1, limit: 250 });
    if (n) return n;
    await wait(delayMs);
  }

  // 2) By templateIds
  if (templateIds.length) {
    for (let i = 0; i < attempts; i++) {
      const n = await tryGet(`/tasks`, {
        templateIds: templateIds.join(","),
        includeArchived: 1,
        limit: 250,
      });
      if (n) return n;
      await wait(delayMs);
    }
  }

  return 0;
}

/* ----------------------------- Component ---------------------------- */

export default function AdminApplianceModal({ open, mode, row, onClose }: Props) {
  const isCreate = mode === "create";

  // base fields (create)
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const [local, setLocal] = useState({
    type: "",
    category: "general",
    imageUrl: "",
    notes: "",
  });

  // additional admin-only details
  const [productUrl, setProductUrl] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [videoUrls, setVideoUrls] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(true);

  // smart name input (create mode)
  const [name, setName] = useState("");
  const [activity, setActivity] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ApplianceLookup[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const catalogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>("");

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLUListElement | null>(null);

  // generation state (after Create)
  const [genCatalogId, setGenCatalogId] = useState<string | null>(null);
  const [genName, setGenName] = useState<string>("");
  const [genSteps, setGenSteps] = useState<GenStep[]>([]);
  const [genProgress, setGenProgress] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [seededCount, setSeededCount] = useState<number | null>(null);
  const [templatesSaved, setTemplatesSaved] = useState<number | null>(null);

  const [debugOpen, setDebugOpen] = useState(false);
  const [debugDry, setDebugDry] = useState<any>(null);
  const [debugReal, setDebugReal] = useState<any>(null);

  function resetGeneration() {
    setGenCatalogId(null);
    setGenName("");
    setGenSteps([
      { key: "ai", label: "Querying AI", status: "idle" },
      { key: "found", label: "Found device", status: "idle" },
      { key: "generate", label: "Generating tasks", status: "idle" },
      { key: "save", label: "Saving", status: "idle" },
      { key: "done", label: "Done", status: "idle" },
    ]);
    setGenProgress(0);
    setGenError(null);
    setSeededCount(null);
    setTemplatesSaved(null);
  }
  function updateStep(key: GenStepKey, patch: Partial<GenStep>) {
    setGenSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  // hydrate when opening/editing
  useEffect(() => {
    if (!open) return;

    resetGeneration();

    if (isCreate) {
      setName("");
      setBrand("");
      setModel("");
      setLocal({ type: "", category: "general", imageUrl: "", notes: "" });
      setProductUrl("");
      setManualUrl("");
      setVideoUrls("");
      setDetailsOpen(true);
      setActivity(null);
      setSuggestions([]);
      setShowSuggestions(false);
    } else if (row) {
      setName(`${row.brand} ${row.model}`.trim());
      setBrand(row.brand);
      setModel(row.model);
      setLocal({
        type: row.type ?? "",
        category: row.category ?? "general",
        imageUrl: row.imageUrl ?? "",
        notes: row.notes ?? "",
      });

      // URLs from notes (best-effort)
      const n = row.notes ?? "";
      const product = /(^|\n)\s*Product:\s*(\S+)/i.exec(n)?.[2] ?? "";
      const manual = /(^|\n)\s*Manual:\s*(\S+)/i.exec(n)?.[2] ?? "";
      const videos = Array.from(n.matchAll(/(^|\n)\s*Video:\s*(\S+)/gi)).map((m) => m[2]);
      setProductUrl(product);
      setManualUrl(manual);
      setVideoUrls(videos.join("\n"));
      setDetailsOpen(true);
      setActivity(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, isCreate, row]);

  // clean up timers when unmount/close
  useEffect(() => {
    return () => {
      if (catalogTimer.current) clearTimeout(catalogTimer.current);
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, []);

  // outside click to close suggestions
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(t) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(t)
      ) {
        setShowSuggestions(false);
        setSuggestions([]);
        setActivity(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const typeOptions = useMemo(
    () => TYPE_BY_CATEGORY[String(local.category || "general")] ?? [],
    [local.category]
  );

  useEffect(() => {
    if (local.type && !typeOptions.some((o) => o.value === local.type)) {
      setLocal((prev) => ({ ...prev, type: "" }));
    }
  }, [typeOptions, local.type]);

  // smart name change (create)
  const handleNameChange = (val: string) => {
    setName(val);

    if (catalogTimer.current) clearTimeout(catalogTimer.current);
    if (aiTimer.current) clearTimeout(aiTimer.current);

    const q = val.trim();
    lastQueryRef.current = q;

    if (!q || q.length < 3) {
      setShowSuggestions(false);
      setSuggestions([]);
      setActivity(null);
      return;
    }

    // Catalog debounce
    catalogTimer.current = setTimeout(async () => {
      try {
        setActivity("Looking through catalog…");
        const res = await api.get("/lookup/appliances", { params: { q } });
        if (lastQueryRef.current !== q) return;
        const cat: ApplianceLookup[] = Array.isArray(res.data) ? res.data : [];

        setSuggestions(cat);
        setShowSuggestions(cat.length > 0);

        if (cat.length === 0) {
          // AI fallback
          aiTimer.current = setTimeout(async () => {
            try {
              if (lastQueryRef.current !== q) return;
              setActivity("Querying AI…");
              const aiRes = await api.get("/ai/lookup-appliance", { params: { q } });
              if (lastQueryRef.current !== q) return;
              const ai = Array.isArray(aiRes.data) ? aiRes.data : [];
              setSuggestions(ai);
              setShowSuggestions(ai.length > 0);
            } catch {
              /* ignore */
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
    setName(`${s.brand} ${s.model}`.trim());
    setBrand(s.brand ?? "");
    setModel(s.model ?? "");
    setLocal((prev) => ({
      ...prev,
      type: normType || prev.type,
      category: (normCat as any) || prev.category,
      imageUrl: s.imageUrl || prev.imageUrl,
      notes: s.notes
        ? [prev.notes?.trim() || "", s.notes.trim()].filter(Boolean).join("\n")
        : prev.notes,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
    setActivity(null);
  };

  /** Merge notes + URLs to a single notes blob for the API. */
  function composeNotes(): string {
    const base = (local.notes ?? "").trim();
    const addl: string[] = [];
    if (productUrl.trim()) addl.push(`Product: ${productUrl.trim()}`);
    if (manualUrl.trim()) addl.push(`Manual: ${manualUrl.trim()}`);
    const vids = videoUrls.split("\n").map((s) => s.trim()).filter(Boolean);
    for (const v of vids) addl.push(`Video: ${v}`);
    return [base, ...addl].filter(Boolean).join("\n");
  }

  const viewTemplatesUrl = genCatalogId
    ? `/admin/AdminTaskTemplates?catalogId=${encodeURIComponent(genCatalogId)}`
    : "#";

  /* ----------------------------- Enrichment orchestration ----------- */

  async function runGeneration(catalogId: string, displayName: string) {
    setGenCatalogId(catalogId);
    setGenName(displayName);
    setGenError(null);
    setSeededCount(null);
    setTemplatesSaved(null);
    setGenProgress(12);
    updateStep("ai", { status: "progress" });

    // Stage 1: dry-run/preview
    let preview: EnrichPreview | null = null;
    try {
      const dry = await api.post(`/admin/catalog/${catalogId}/enrich`, { dryRun: 1 });
      preview = normalizePreview(dry?.data);
      updateStep("ai", { status: "success" });
      setDebugDry(dry?.data);
      setGenProgress(28);
    } catch (e: any) {
      updateStep("ai", { status: "error", detail: "Failed to query AI." });
      setGenError(e?.response?.data?.error ?? e.message ?? "Failed to query AI.");
      setGenProgress(100);
      return;
    }

    // Stage 2: found device (use preview counts if present)
    const dryTotal =
      (preview?.created?.length ?? 0) +
        (preview?.updated?.length ?? 0) +
        (preview?.skipped?.length ?? 0) ||
      Number(preview?.raw?.__summaryTotal ?? 0);

    updateStep("found", {
      status: "success",
      detail:
        dryTotal > 0
          ? `Found ${dryTotal} template${dryTotal === 1 ? "" : "s"}.`
          : "Analyzing templates…",
    });
    setGenProgress(40);

    // Stage 3: persist + seed
    updateStep("generate", { status: "progress" });
    setGenProgress(58);

    let applied: EnrichPreview | null = null;
    try {
      const real = await api.post(`/admin/catalog/${catalogId}/enrich`);
      applied = normalizePreview(real?.data);
      setDebugReal(real?.data);
      updateStep("generate", { status: "success" });
      setGenProgress(74);
    } catch (e: any) {
      updateStep("generate", { status: "error", detail: "Failed to generate." });
      setGenError(e?.response?.data?.error ?? e.message ?? "Failed to generate.");
      setGenProgress(100);
      return;
    }

    const arraysTotal =
      (applied?.created?.length ?? 0) +
      (applied?.updated?.length ?? 0) +
      (applied?.skipped?.length ?? 0);

    const numericTotal = Number(applied?.raw?.__summaryTotal ?? 0);
    const totalTemplates = arraysTotal || numericTotal;

    // Optionally fetch linked template titles to display
    try {
      const cat = await api.get(`/admin/catalog/${catalogId}`);
      const linked = Array.isArray(cat?.data?.linkedTemplates)
        ? cat.data.linkedTemplates
        : [];
      const foundTitles = linked.map((t: any) => t?.title).filter(Boolean).slice(0, 20);
      if (foundTitles.length) {
        updateStep("found", {
          status: "success",
          detail: `Found ${totalTemplates} template${totalTemplates === 1 ? "" : "s"}: ${foundTitles.join(", ")}`,
        });
      } else if (!dryTotal) {
        updateStep("found", {
          status: "success",
          detail: `Found ${totalTemplates} template${totalTemplates === 1 ? "" : "s"}.`,
        });
      }
    } catch {
      if (!dryTotal) {
        updateStep("found", {
          status: "success",
          detail: `Found ${totalTemplates} template${totalTemplates === 1 ? "" : "s"}.`,
        });
      }
    }

    // Stage 4: saving (and count seeded tasks)
    setTemplatesSaved(totalTemplates);
    updateStep("save", {
      status: "progress",
      detail: `Saving ${totalTemplates} template${totalTemplates === 1 ? "" : "s"}…`,
    });
    setGenProgress(82);

    const templateIds = (applied?.created || [])
      .map((t: any) => t?.id)
      .filter(Boolean) as string[];

    // Prefer explicit seeded count if present; otherwise poll
    let seeded = applied?.seededTasks ?? 0;
    if (!seeded) {
      seeded = await pollForSeededCount(catalogId, templateIds);
    }
    setSeededCount(seeded);

    updateStep("save", {
      status: "success",
      detail: `Saved ${totalTemplates} template${totalTemplates === 1 ? "" : "s"} • Seeded ${seeded} user task${seeded === 1 ? "" : "s"}.`,
    });
    setGenProgress(94);

    // Stage 5: done
    updateStep("done", {
      status: "success",
      detail: `Done! Seeded ${seeded} task${seeded === 1 ? "" : "s"} for “${displayName}”.`,
    });
    setGenProgress(100);
  }

  /* ----------------------------- Save -------------------------------- */

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        type: local.type || null,
        category: local.category || null,
        imageUrl: local.imageUrl?.trim() || null,
        notes: composeNotes() || null,
      };

      if (isCreate) {
        const cleanBrand = brand.trim();
        const cleanModel = model.trim();

        // If Name typed but not fields, attempt a simple split
        if ((!cleanBrand || !cleanModel) && name.trim()) {
          const parts = name.trim().split(/\s+/);
          if (!cleanBrand && parts.length >= 1) setBrand(parts[0]);
          if (!cleanModel && parts.length >= 2) setModel(parts.slice(1).join(" "));
        }

        const finalBrand = (cleanBrand || brand).trim();
        const finalModel = (cleanModel || model).trim();
        if (!finalBrand || !finalModel) {
          alert("Brand and Model are required.");
          setSaving(false);
          return;
        }

        // Create the catalog entry
        const r = await api.post(`/admin/catalog`, {
          brand: finalBrand,
          model: finalModel,
          ...payload,
        });

        // Kick off generation view (hide the form)
        const createdId = r?.data?.id ?? r?.data?.catalog?.id;
        if (createdId) {
          const label = `${finalBrand} ${finalModel}`;
          await runGeneration(createdId, label);
        }
      } else if (row) {
        await api.put(`/admin/catalog/${row.id}`, payload);
        onClose(true);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------- Render ------------------------------ */

  if (!open || (!isCreate && !row)) return null;

  const compact = !!genCatalogId; // while generating, show compact panel
  const canClose = compact ? genProgress >= 100 || !!genError : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card
        className={[
          "bg-card text-body rounded-xl shadow-lg relative border border-token",
          compact ? "w-full max-w-md p-4" : "w-full max-w-xl p-6",
        ].join(" ")}
      >
        <button
          onClick={() => canClose && onClose(!!genCatalogId)}
          className={`absolute top-3 right-3 ${canClose ? "text-muted hover:text-body" : "text-muted cursor-not-allowed"}`}
          aria-label="Close"
          disabled={!canClose}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-xl font-semibold mb-1">
          {isCreate ? "New Catalog Item" : `${row!.brand} ${row!.model}`}
        </div>
        {!isCreate && row?.createdAt ? (
          <p className="text-xs text-muted mb-4">
            Created: {new Date(row.createdAt).toLocaleString()} • Used by {row.trackablesCount} trackable(s)
          </p>
        ) : !compact ? (
          <div className="mb-2" />
        ) : null}

        {/* COMPACT: Task Generation only */}
        {compact && (
          <div className="rounded-lg border border-token p-3">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Task Generation
            </div>
            <div className="mb-2">
              <LinearProgress value={genProgress} />
            </div>

            {genError ? (
              <div className="flex items-center gap-2 text-sm text-red-700">
                <CircleAlert className="h-4 w-4" />
                {genError}
              </div>
            ) : (
              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {genSteps.map((s) => (
                    <motion.li
                      key={s.key}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      {s.status === "progress" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {s.status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                      {s.status === "error" ? <CircleAlert className="h-4 w-4 text-red-600" /> : null}
                      <span className={s.status === "error" ? "text-red-700" : ""}>
                        {s.label}
                        {s.detail ? <span className="text-muted"> — {s.detail}</span> : null}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {genProgress >= 100 && (
              <>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Done!</span>{" "}
                  Saved <span className="font-medium">{templatesSaved ?? 0}</span>{" "}
                  template{(templatesSaved ?? 0) === 1 ? "" : "s"}
                  {typeof seededCount === "number" ? (
                    <>
                      {" "}&middot; Seeded <span className="font-medium">{seededCount}</span>{" "}
                      user task{seededCount === 1 ? "" : "s"}
                    </>
                  ) : null}
                  {genName ? <> for “{genName}”</> : null}.
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <Link to={viewTemplatesUrl} className="inline-flex">
                    <Button variant="outline">View templates</Button>
                  </Link>
                  <Button onClick={() => onClose(true)}>Done</Button>
                </div>
              </>
            )}

            {genProgress < 100 && !genError && (
              <div className="mt-3 flex justify-end">
                <Button variant="outline" disabled>
                  Working…
                </Button>
              </div>
            )}

            {genError && (
              <div className="mt-3 flex justify-end">
                <Button variant="outline" onClick={() => onClose(true)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        )}

        {(debugDry || debugReal) && (
          <div className="mt-2">
            <button
              className="text-xs text-muted hover:underline"
              onClick={() => setDebugOpen((v) => !v)}
              type="button"
            >
              {debugOpen ? "Hide raw response" : "Show raw response"}
            </button>
            {debugOpen && (
              <div className="mt-2 max-h-48 overflow-auto rounded border border-token bg-surface-alt p-2">
                <div className="text-[11px] font-mono whitespace-pre">
                  {debugDry ? `-- dryRun --\n${JSON.stringify(debugDry, null, 2)}\n\n` : ""}
                  {debugReal ? `-- apply --\n${JSON.stringify(debugReal, null, 2)}` : ""}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FULL FORM (hidden while generating) */}
        {!compact && (
          <>
            {isCreate && (
              <div className="space-y-2 mb-3">
                <div className="text-sm font-medium">Name</div>
                <div className="relative">
                  <Input
                    ref={nameInputRef}
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => { setShowSuggestions(false); }, 100)}
                    placeholder="e.g., Bosch SHXM63W55N Dishwasher, Samsung UN55U8000F TV"
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
                          title={`${s.brand} ${s.model}`}
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
                {activity ? (
                  <div className="mb-3 rounded-lg border border-token bg-surface-alt px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[rgb(var(--primary))] animate-pulse" />
                      {activity}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {isCreate && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">Brand</div>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g., Samsung" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Model</div>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g., RF28R7351" />
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div>
                <div className="text-sm font-medium mb-1">Category</div>
                <select
                  value={String(local.category || "general")}
                  onChange={(e) => setLocal((s) => ({ ...s, category: e.target.value }))}
                  className="w-full border border-token bg-card text-body rounded px-3 py-2"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Type</div>
                <select
                  value={local.type}
                  onChange={(e) => setLocal((s) => ({ ...s, type: e.target.value }))}
                  className="w-full border border-token bg-card text-body rounded px-3 py-2"
                >
                  <option value="">(choose…)</option>
                  {typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Image URL</div>
              <Input
                placeholder="https://…"
                value={local.imageUrl}
                onChange={(e) => setLocal((s) => ({ ...s, imageUrl: e.target.value }))}
              />
            </div>

            <div className="border border-token rounded-lg mt-3">
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="font-medium text-body">Additional details</span>
                {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {detailsOpen && (
                <div className="px-3 pb-3 pt-1 space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Notes</div>
                    <textarea
                      rows={3}
                      className="w-full border border-token bg-card text-body rounded px-3 py-2"
                      value={local.notes}
                      onChange={(e) => setLocal((s) => ({ ...s, notes: e.target.value }))}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Product Page URL</div>
                    <Input
                      placeholder="https://manufacturer.com/product"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Manual (PDF) URL</div>
                    <Input
                      placeholder="https://manufacturer.com/manual.pdf"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">YouTube / Video URLs (one per line)</div>
                    <textarea
                      rows={3}
                      placeholder="https://youtu.be/…"
                      className="w-full border border-token bg-card text-body rounded px-3 py-2"
                      value={videoUrls}
                      onChange={(e) => setVideoUrls(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {!isCreate && row && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Linked Templates</div>
                {row.linkedTemplates.length === 0 ? (
                  <div className="text-sm text-muted">None linked yet.</div>
                ) : (
                  <ul className="list-disc pl-5 text-sm">
                    {row.linkedTemplates.map((t) => (
                      <li key={t.id}>
                        {t.title} <span className="text-muted">({t.recurrenceInterval})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>
                Close
              </Button>
              <Button onClick={save} disabled={saving || (isCreate && (!brand.trim() || !model.trim()))}>
                {saving ? "Saving…" : isCreate ? "Create" : "Save"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
