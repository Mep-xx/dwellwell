import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/utils/api";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LinkedTemplate = {
  id?: string;
  title: string;
  description?: string | null;
  recurrenceInterval?: string | null;
  criticality?: "low" | "medium" | "high";
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: { label: string; url: string }[];
  [k: string]: any;
};

type EnrichPreview = {
  summary?: string;
  created?: LinkedTemplate[];
  updated?: LinkedTemplate[];
  skipped?: LinkedTemplate[];
  raw?: any;
};

type Props = {
  open: boolean;
  catalogId: string;
  brand: string;
  model: string;
  onClose: () => void;
  onApplied?: () => void;
};

export default function AdminEnrichModal({
  open,
  catalogId,
  brand,
  model,
  onClose,
  onApplied,
}: Props) {
  // keep hook order stable
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [preview, setPreview] = useState<EnrichPreview | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    mountedRef.current = true;
    setLoading(true);
    setApplying(false);
    setError(null);
    setPreview(null);

    (async () => {
      try {
        // optional: hydrate current meta (ignore 404)
        await api
          .get(`/admin/catalog/${catalogId}`)
          .then((rowRes) => {
            const row = rowRes?.data ?? {};
            setCategory(row.category ?? "");
            setType(row.type ?? "");
            setImageUrl(row.imageUrl ?? "");
            setNotes(row.notes ?? "");
          })
          .catch(() => void 0);

        // try dry-run, fall back to real call
        let view: EnrichPreview | null = null;
        try {
          const dry = await api.post(`/admin/catalog/${catalogId}/enrich`, { dryRun: 1 });
          view = normalizePreview(dry?.data);
        } catch {
          const real = await api.post(`/admin/catalog/${catalogId}/enrich`);
          view = normalizePreview(real?.data);
        }
        if (mountedRef.current) setPreview(view ?? { summary: "No details available.", raw: null });
      } catch (e: any) {
        if (mountedRef.current) setError(e?.response?.data?.error ?? e.message ?? "Failed to load preview.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => { mountedRef.current = false; };
  }, [open, catalogId]);

  const displayBlocks = useMemo(() => ([
    { label: "Created", items: preview?.created ?? [] },
    { label: "Updated", items: preview?.updated ?? [] },
    { label: "Skipped", items: preview?.skipped ?? [] },
  ]), [preview]);

  const apply = async () => {
    setApplying(true);
    setError(null);
    try {
      // best-effort metadata save first (don’t fail enrich if this 404s)
      await api.put(`/admin/catalog/${catalogId}`, {
        category: category || null,
        type: type || null,
        imageUrl: imageUrl || null,
        notes: notes || null,
      }).catch(() => void 0);

      const res = await api.post(`/admin/catalog/${catalogId}/enrich`);
      const normalized = normalizePreview(res?.data);
      setPreview(normalized);
      onApplied?.();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Failed to apply enrichment.");
    } finally {
      setApplying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card text-body rounded-xl w-full max-w-2xl p-6 shadow-lg relative border border-token">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted hover:text-body" aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-1">{brand} {model}</h2>
        <div className="text-[11px] text-muted mb-4">Catalog ID: {catalogId}</div>

        {/* Editable meta (optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs font-medium mb-1">Category</div>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., appliance, entertainment" />
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Type</div>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g., refrigerator, television" />
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-medium mb-1">Image URL</div>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-medium mb-1">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-token rounded px-3 py-2 bg-card"
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="rounded-lg border border-token p-3 mb-3">
          <div className="text-sm font-medium mb-1">Preview</div>
          {loading ? (
            <div className="text-muted text-sm">Querying AI / building preview…</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            <>
              {preview?.summary && <p className="text-sm mb-2">{preview.summary}</p>}
              {displayBlocks.map((b) =>
                b.items.length ? (
                  <div key={b.label} className="mb-2">
                    <div className="text-xs uppercase text-muted mb-1">{b.label}</div>
                    <ul className="space-y-1">
                      {b.items.map((t, idx) => (
                        <li key={`${t.id || t.title}-${idx}`} className="border border-token rounded p-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{t.title}</div>
                            {t.recurrenceInterval ? (
                              <span className="text-xs text-muted">{t.recurrenceInterval}</span>
                            ) : null}
                          </div>
                          {t.description ? <p className="text-xs text-muted mt-1">{t.description}</p> : null}
                          {!!(t.steps?.length || t.equipmentNeeded?.length || t.resources?.length) && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {t.steps?.length ? (
                                <div>
                                  <div className="text-[11px] uppercase text-muted mb-1">Steps</div>
                                  <ul className="list-disc pl-4 text-xs space-y-0.5">
                                    {t.steps.map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              ) : null}
                              {t.equipmentNeeded?.length ? (
                                <div>
                                  <div className="text-[11px] uppercase text-muted mb-1">Equipment</div>
                                  <ul className="list-disc pl-4 text-xs space-y-0.5">
                                    {t.equipmentNeeded.map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              ) : null}
                              {t.resources?.length ? (
                                <div>
                                  <div className="text-[11px] uppercase text-muted mb-1">Resources</div>
                                  <ul className="list-disc pl-4 text-xs space-y-0.5">
                                    {t.resources.map((r, i) => (
                                      <li key={i}>
                                        {r.url ? (
                                          <a href={r.url} target="_blank" rel="noreferrer" className="underline text-xs">
                                            {r.label || r.url}
                                          </a>
                                        ) : (
                                          <span className="text-xs">{r.label}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
              {!displayBlocks.some((b) => b.items.length) && (
                <div className="text-sm text-muted">No new or updated templates were detected.</div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={applying || loading}>Cancel</Button>
          <Button onClick={apply} disabled={applying || loading}>
            {applying ? "Applying (adding tasks)…" : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function normalizePreview(raw: any): EnrichPreview {
  if (!raw) return { summary: "No details available.", raw };

  const created = raw.created ?? raw.tasksCreated ?? [];
  const updated = raw.updated ?? raw.tasksUpdated ?? [];
  const skipped = raw.skipped ?? raw.tasksSkipped ?? [];

  const summary =
    raw.summary ??
    (Array.isArray(created) || Array.isArray(updated) || Array.isArray(skipped)
      ? `Created ${created?.length ?? 0}, updated ${updated?.length ?? 0}, skipped ${skipped?.length ?? 0}.`
      : "Enrichment completed.");

  if (Array.isArray(raw) && !created.length && !updated.length && !skipped.length) {
    return { summary: `Created ${raw.length} template(s).`, created: raw, updated: [], skipped: [], raw };
  }

  return {
    summary,
    created: Array.isArray(created) ? created : [],
    updated: Array.isArray(updated) ? updated : [],
    skipped: Array.isArray(skipped) ? skipped : [],
    raw,
  };
}
