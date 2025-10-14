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
  mode: "create" | "edit";
  row?: AdminApplianceRow | null;
  onClose: (refetch?: boolean) => void;
};

export default function AdminApplianceModal({ open, mode, row, onClose }: Props) {
  const isCreate = mode === "create";

  // stable hooks
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const [local, setLocal] = useState({
    type: "",
    category: "general",
    imageUrl: "",
    notes: "",
  });

  // hydrate when opening/editing
  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setBrand("");
      setModel("");
      setLocal({ type: "", category: "general", imageUrl: "", notes: "" });
    } else if (row) {
      setBrand(row.brand);
      setModel(row.model);
      setLocal({
        type: row.type ?? "",
        category: row.category ?? "general",
        imageUrl: row.imageUrl ?? "",
        notes: row.notes ?? "",
      });
    }
  }, [open, isCreate, row]);

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
    setSaving(true);
    try {
      if (isCreate) {
        if (!brand.trim() || !model.trim()) {
          alert("Brand and model are required.");
          setSaving(false);
          return;
        }
        await api.post(`/admin/catalog`, {
          brand: brand.trim(),
          model: model.trim(),
          type: local.type || null,
          category: local.category || null,
          imageUrl: local.imageUrl?.trim() || null,
          notes: local.notes?.trim() || null,
        });
      } else if (row) {
        await api.put(`/admin/catalog/${row.id}`, {
          type: local.type || null,
          category: local.category || null,
          imageUrl: local.imageUrl?.trim() || null,
          notes: local.notes?.trim() || null,
        });
      }
      onClose(true);
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

  // CLOSED
  if (!open || (!isCreate && !row)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="bg-card text-body rounded-xl w-full max-w-xl p-6 shadow-lg relative border border-token">
        <div className="text-xl font-semibold mb-1">
          {isCreate ? "New Catalog Item" : `${row!.brand} ${row!.model}`}
        </div>
        {!isCreate && row?.createdAt ? (
          <p className="text-xs text-muted mb-4">
            Created: {new Date(row.createdAt).toLocaleString()} • Used by {row.trackablesCount} trackable(s)
          </p>
        ) : null}

        <div className="space-y-4">
          {/* Brand/Model only editable in Create mode */}
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

          {!isCreate && row && (
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
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || (isCreate && (!brand.trim() || !model.trim()))}>
            {saving ? "Saving…" : isCreate ? "Create" : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
