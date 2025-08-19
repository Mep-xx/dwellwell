import { useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';
import { TaskTemplate as SharedTaskTemplate } from '@shared/types/task';

// ---- Local types (extend your shared type with DB fields) ----
type ResourceLink = { label: string; url: string };
type AdminTaskTemplate = SharedTaskTemplate & {
  id: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  resources?: ResourceLink[];
};

// ---- Small helpers (no generics, no JSX-ish syntax) ----
function parseList(s: string): string[] {
  return s && s.trim() ? s.split('\n').map((x) => x.trim()).filter(Boolean) : [];
}
function resourcesToText(res: ResourceLink[] | undefined): string {
  if (!res || !Array.isArray(res)) return '';
  return res.map((r) => `${r.label ?? ''} | ${r.url ?? ''}`.trim()).join('\n');
}
function textToResources(s: string): ResourceLink[] {
  if (!s || !s.trim()) return [];
  const lines = s.split('\n');
  const out: ResourceLink[] = [];
  for (const raw of lines) {
    const parts = raw.split('|');
    const label = (parts[0] || '').trim();
    const url = (parts[1] || '').trim();
    if (label || url) out.push({ label, url });
  }
  return out;
}

export default function AdminTaskTemplates() {
  const [templates, setTemplates] = useState<AdminTaskTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTaskTemplate | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const res = await api.get<AdminTaskTemplate[]>('/admin/task-templates');
      setTemplates(res.data);
    } catch (e: any) {
      alert(`Failed to load templates: ${e?.response?.data?.message ?? e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasToken = !!localStorage.getItem('dwellwell-token');
    if (!hasToken) {
      window.location.href = '/login';
      return;
    }
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this task template?')) return;
    try {
      await api.delete(`/admin/task-templates/${id}`);
      fetchTemplates();
    } catch (e: any) {
      alert(`Delete failed: ${e?.response?.data?.message ?? e.message}`);
    }
  }

  function handleEdit(template: AdminTaskTemplate) {
    setEditing(template);
    setIsModalOpen(true);
  }

  function handleCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      (t.title ?? '').toLowerCase().includes(q) ||
      (t.category ?? '').toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-2xl font-semibold">Task Templates</h2>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Search title/category/desc…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Template
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Recurrence</th>
              <th className="text-left p-2">Criticality</th>
              <th className="text-left p-2">Updated</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={6}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  No templates found.{' '}
                  <button className="text-blue-600 underline" onClick={handleCreate}>Create one</button>.
                </td>
              </tr>
            ) : filtered.map((template) => (
              <tr key={template.id} className="border-t align-top">
                <td className="p-2">
                  <div className="font-medium">{template.title}</div>
                  {template.description && (
                    <div className="text-gray-500 text-xs line-clamp-2">{template.description}</div>
                  )}
                </td>
                <td className="p-2">{template.category ?? '—'}</td>
                <td className="p-2">{template.recurrenceInterval}</td>
                <td className="p-2 capitalize">{template.criticality}</td>
                <td className="p-2 text-xs">
                  {template.updatedAt
                    ? new Date(template.updatedAt).toLocaleString()
                    : template.createdAt
                      ? new Date(template.createdAt).toLocaleString()
                      : '—'}
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <TemplateModal
          template={editing}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchTemplates}
        />
      )}
    </div>
  );
}

function TemplateModal(props: {
  template: AdminTaskTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { template, onClose, onSaved } = props;

  const [saving, setSaving] = useState(false);
  const [resourcesText, setResourcesText] = useState(
    resourcesToText(template ? template.resources : [])
  );

  const [form, setForm] = useState<AdminTaskTemplate>({
    id: template ? template.id : '',
    title: template ? template.title : '',
    description: template ? template.description : '',
    recurrenceInterval: template ? template.recurrenceInterval : 'monthly',
    criticality: template ? template.criticality : 'low',
    canDefer: template ? !!template.canDefer : true,
    deferLimitDays: template ? (template.deferLimitDays ?? 7) : 7,
    estimatedTimeMinutes: template ? (template.estimatedTimeMinutes ?? 10) : 10,
    estimatedCost: template ? (template.estimatedCost ?? 0) : 0,
    canBeOutsourced: template ? !!template.canBeOutsourced : false,
    category: template ? (template.category ?? '') : '',
    icon: template ? (template.icon ?? '🧰') : '🧰',
    taskType: template ? (template.taskType ?? 'GENERAL') : 'GENERAL',
    steps: template ? (template.steps ?? []) : [],
    equipmentNeeded: template ? (template.equipmentNeeded ?? []) : [],
    resources: template ? (template.resources ?? []) : [],
    createdAt: template ? (template.createdAt ?? null) : null,
    updatedAt: template ? (template.updatedAt ?? null) : null,
  });

  function setField(k: keyof AdminTaskTemplate, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const cleanedResources = textToResources(resourcesText);
      const body: any = {
        ...form,
        steps: form.steps || [],
        equipmentNeeded: form.equipmentNeeded || [],
        resources: cleanedResources,
      };
      delete body.id;
      delete body.createdAt;
      delete body.updatedAt;

      if (template && template.id) {
        await api.put(`/admin/task-templates/${template.id}`, body);
      } else {
        await api.post('/admin/task-templates', body);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(`Save failed: ${e?.response?.data?.message ?? e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {template ? 'Edit Task Template' : 'New Task Template'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Category (e.g., Bathroom, Kitchen)"
            value={form.category || ''}
            onChange={(e) => setField('category', e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={form.recurrenceInterval}
            onChange={(e) => setField('recurrenceInterval', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={form.criticality}
            onChange={(e) => setField('criticality', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={form.deferLimitDays || 0}
              onChange={(e) => setField('deferLimitDays', Number(e.target.value) || 0)}
              className="border p-2 rounded w-full"
              placeholder="Defer limit (days)"
            />
            <input
              type="number"
              min={0}
              value={form.estimatedTimeMinutes || 0}
              onChange={(e) => setField('estimatedTimeMinutes', Number(e.target.value) || 0)}
              className="border p-2 rounded w-full"
              placeholder="Time (mins)"
            />
            <input
              type="number"
              min={0}
              value={form.estimatedCost || 0}
              onChange={(e) => setField('estimatedCost', Number(e.target.value) || 0)}
              className="border p-2 rounded w-full"
              placeholder="Cost ($)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="canDefer"
              type="checkbox"
              checked={!!form.canDefer}
              onChange={(e) => setField('canDefer', e.target.checked)}
            />
            <label htmlFor="canDefer">Can Defer</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="canBeOutsourced"
              type="checkbox"
              checked={!!form.canBeOutsourced}
              onChange={(e) => setField('canBeOutsourced', e.target.checked)}
            />
            <label htmlFor="canBeOutsourced">Can Be Outsourced</label>
          </div>

          <input
            type="text"
            placeholder="Icon (emoji or name)"
            value={form.icon || ''}
            onChange={(e) => setField('icon', e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={form.taskType || 'GENERAL'}
            onChange={(e) => setField('taskType', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="GENERAL">GENERAL</option>
            <option value="APPLIANCE">APPLIANCE</option>
            <option value="OUTDOOR">OUTDOOR</option>
            <option value="SAFETY">SAFETY</option>
          </select>

          <textarea
            placeholder="Description"
            rows={3}
            value={form.description || ''}
            onChange={(e) => setField('description', e.target.value)}
            className="border p-2 rounded md:col-span-2"
          />

          <textarea
            placeholder="Steps (one per line)"
            rows={4}
            value={(form.steps || []).join('\n')}
            onChange={(e) => setField('steps', parseList(e.target.value))}
            className="border p-2 rounded"
          />
          <textarea
            placeholder="Equipment Needed (one per line)"
            rows={4}
            value={(form.equipmentNeeded || []).join('\n')}
            onChange={(e) => setField('equipmentNeeded', parseList(e.target.value))}
            className="border p-2 rounded"
          />
          <textarea
            placeholder="Resources (Label | URL, one per line)"
            rows={4}
            value={resourcesText}
            onChange={(e) => setResourcesText(e.target.value)}
            className="border p-2 rounded md:col-span-2"
          />
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            disabled={saving || !form.title}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
