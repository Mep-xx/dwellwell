import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CATEGORY_OPTIONS, TYPE_BY_CATEGORY } from "@shared/constants/trackables";

type LinkedTemplate = { id: string; title: string; recurrenceInterval: string };
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
  row: AdminApplianceRow | null;
  onClose: (refetch?: boolean) => void;
};

export default function AdminApplianceModal({ open, row, onClose }: Props) {
  // Always initialize hooks in a stable way to avoid React’s hook-order complaints
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState({
    type: "",
    category: "general",
    imageUrl: "",
    notes: "",
  });

  // hydrate when row changes
  useEffect(() => {
    if (!row) return;
    setLocal({
      type: row.type ?? "",
      category: row.category ?? "general",
      imageUrl: row.imageUrl ?? "",
      notes: row.notes ?? "",
    });
  }, [row]);

  const typeOptions = useMemo(
    () => TYPE_BY_CATEGORY[String(local.category || "general")] ?? [],
    [local.category]
  );

  useEffect(() => {
    if (local.type && !typeOptions.some((o) => o.value === local.type)) {
      setLocal((prev) => ({ ...prev, type: "" }));
    }
  }, [typeOptions, local.type]);

  const save = async () => {
    if (!row) return;
    setSaving(true);
    try {
      await api.put(`/admin/catalog/${row.id}`, {
        type: local.type || null,
        category: local.category || null,
        imageUrl: local.imageUrl?.trim() || null,
        notes: local.notes?.trim() || null,
      });
      onClose(true);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e.message);
    } finally {
      setSaving(false);
    }
  };

  // Render nothing when closed, but keep hook order stable above
  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="bg-card text-body rounded-xl w-full max-w-xl p-6 shadow-lg relative border border-token">
        <div className="text-xl font-semibold">
          {row.brand} {row.model}
        </div>
        <p className="text-xs text-muted mb-4">
          Created: {new Date(row.createdAt).toLocaleString()} • Used by {row.trackablesCount} trackable(s)
        </p>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
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

          <div>
            <div className="text-sm font-medium mb-1">Image URL</div>
            <Input
              placeholder="https://…"
              value={local.imageUrl}
              onChange={(e) => setLocal((s) => ({ ...s, imageUrl: e.target.value }))}
            />
          </div>

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
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </Card>
    </div>
  );
}
