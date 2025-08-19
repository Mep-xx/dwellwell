import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { TaskTemplate } from '@shared/types/task';

export default function AdminTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);

  const fetchTemplates = async () => {
    const res = await api.get('/admin/taskTemplates'); // ← no /api
    setTemplates(res.data);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task template?')) {
      await api.delete('/admin/taskTemplates/${id}'); // ← no /api
      fetchTemplates();
    }
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditing(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Task Templates</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Template
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Recurrence</th>
              <th className="text-left p-2">Criticality</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-t">
                <td className="p-2">{template.title}</td>
                <td className="p-2">{template.category}</td>
                <td className="p-2">{template.recurrenceInterval}</td>
                <td className="p-2">{template.criticality}</td>
                <td className="p-2 space-x-2">
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
          onSave={fetchTemplates}
        />
      )}
    </div>
  );
}

function TemplateModal({
  template,
  onClose,
  onSave,
}: {
  template: TaskTemplate | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<TaskTemplate>(
    template || {
      id: '',
      title: '',
      description: '',
      recurrenceInterval: 'monthly',
      criticality: 'low',
      canDefer: true,
      deferLimitDays: 7,
      estimatedTimeMinutes: 10,
      estimatedCost: 0,
      canBeOutsourced: false,
      category: '',
      icon: '🧰',
      taskType: 'GENERAL',
      steps: [],
      equipmentNeeded: [],
      resources: [],
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const isEdit = Boolean(template);
    if (isEdit) {
      await api.put('/admin/taskTemplates/${template!.id}', form); // ← no /api
    } else {
      await api.post('/admin/taskTemplates', form); // ← no /api
    }
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">
          {template ? 'Edit Task Template' : 'New Task Template'}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <select
            name="recurrenceInterval"
            value={form.recurrenceInterval}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select
            name="criticality"
            value={form.criticality}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="number"
            name="deferLimitDays"
            value={form.deferLimitDays}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Defer Limit Days"
          />
          <input
            type="number"
            name="estimatedTimeMinutes"
            value={form.estimatedTimeMinutes}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Time (min)"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
