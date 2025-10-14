import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import AdminApplianceModal, { AdminApplianceRow } from "./AdminApplianceModal";
import AdminEnrichModal from "./AdminEnrichModal";

type Row = AdminApplianceRow;

export default function AdminApplianceCatalog() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [editRow, setEditRow] = useState<Row | null>(null);
  const [enrichRow, setEnrichRow] = useState<Row | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<Row[]>("/admin/catalog", {
        params: { q: q || undefined },
      });
      setRows(data);
    } catch (e) {
      console.error("Failed to load catalog", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasToken = !!localStorage.getItem("dwellwell-token");
    if (!hasToken) {
      window.location.href = "/login";
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.brand.toLowerCase().includes(s) ||
        r.model.toLowerCase().includes(s) ||
        (r.type ?? "").toLowerCase().includes(s) ||
        (r.category ?? "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  async function handleDelete(row: Row) {
    if (!confirm(`Delete "${row.brand} ${row.model}" from the catalog?`)) return;

    setDeletingId(row.id);
    // optimistic: remove from UI first
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== row.id));

    try {
      await api.delete(`/admin/catalog/${row.id}`);
    } catch (e: any) {
      // revert on failure
      setRows(prev);
      const status = e?.response?.status;
      if (status === 409) {
        const c = e?.response?.data?.trackablesCount ?? 0;
        alert(
          `Cannot delete — this catalog item is referenced by ${c} trackable${c === 1 ? "" : "s"}.`
        );
      } else {
        console.error("Delete failed", e);
        alert("Delete failed. Check console for details.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Appliance Catalog</h1>
        <div className="flex gap-2">
          <Input
            className="w-72"
            placeholder="Search brand/model/type/category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <Button variant="secondary" onClick={load}>Search</Button>
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-2 text-left">Brand / Model</th>
                <th className="p-2 text-left">Type / Category</th>
                <th className="p-2 text-left">Templates</th>
                <th className="p-2 text-left">Used</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-3 text-muted-foreground" colSpan={5}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-6 text-muted-foreground" colSpan={5}>No results.</td></tr>
              ) : (
                filtered.map((r) => {
                  const inUse = (r.trackablesCount ?? 0) > 0;
                  return (
                    <tr key={r.id} className="border-t align-top">
                      <td className="p-2">
                        <div className="flex items-start gap-3">
                          {r.imageUrl ? (
                            <img
                              src={r.imageUrl}
                              alt={`${r.brand} ${r.model}`}
                              className="w-12 h-12 object-cover rounded-md border border-token"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md border border-dashed border-token flex items-center justify-center text-[10px] text-muted-foreground">No image</div>
                          )}
                          <div>
                            <div className="font-medium">{r.brand} {r.model}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(r.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-2">
                        <div>{r.type ?? <span className="text-muted-foreground">type</span>}</div>
                        <div className="text-muted-foreground">{r.category ?? "category"}</div>
                      </td>

                      <td className="p-2">
                        {r.linkedTemplates.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <ul className="list-disc pl-4">
                            {r.linkedTemplates.map((t) => (
                              <li key={t.id}>
                                {t.title}{" "}
                                <span className="text-muted-foreground">({t.recurrenceInterval})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>

                      <td className="p-2">{r.trackablesCount}</td>

                      <td className="p-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setEditRow(r)}>Edit</Button>
                          <Button onClick={() => setEnrichRow(r)}>Enrich</Button>
                          <Button
                            variant="destructive"
                            disabled={inUse || deletingId === r.id}
                            title={
                              inUse
                                ? "Cannot delete: this model is referenced by existing trackables"
                                : "Delete this catalog entry"
                            }
                            onClick={() => handleDelete(r)}
                          >
                            {deletingId === r.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit modal */}
      <AdminApplianceModal
        key={editRow?.id || "edit-none"}
        open={!!editRow}
        row={editRow}
        onClose={(refetch) => {
          setEditRow(null);
          if (refetch) load();
        }}
      />

      {/* Enrich modal */}
      {enrichRow && (
        <AdminEnrichModal
          key={enrichRow.id}
          open={!!enrichRow}
          catalogId={enrichRow.id}
          brand={enrichRow.brand}
          model={enrichRow.model}
          onClose={() => setEnrichRow(null)}
          onApplied={load}
        />
      )}
    </div>
  );
}
