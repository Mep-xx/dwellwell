import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../utils/api';
import { sanitize } from '../utils/sanitize';
import type { Trackable, TrackableCategory } from '@shared/types/trackable';

// Props and types

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trackable: Trackable) => void;
  initialData?: Trackable | null;
};

type ApplianceLookup = {
  brand: string;
  model: string;
  type: string;
  category: string;
  notes?: string;
  imageUrl?: string;
};

const categories: { label: string; value: TrackableCategory }[] = [
  { label: 'Appliance', value: 'appliance' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Bathroom', value: 'bathroom' },
  { label: 'Outdoor', value: 'outdoor' },
  { label: 'Safety', value: 'safety' },
  { label: 'Heating', value: 'heating' },
  { label: 'Cooling', value: 'cooling' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Plumbing', value: 'plumbing' },
  { label: 'General', value: 'general' },
];

export default function TrackableModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [form, setForm] = useState<Trackable>({
    id: uuidv4(),
    userDefinedName: '',
    brand: '',
    model: '',
    type: '',
    category: 'GENERAL',
    serialNumber: '',
    imageUrl: '',
    notes: ''
  });

  const [suggestions, setSuggestions] = useState<ApplianceLookup[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lookupTimer, setLookupTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      resetForm();
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen && !initialData) {
      resetForm();
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setForm({
      id: uuidv4(),
      name: '',
      type: '',
      category: 'general',
      brand: '',
      model: '',
      serialNumber: '',
      image: '',
      notes: '',
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  
    if (name === 'name' && value.length >= 3) {
      if (lookupTimer) clearTimeout(lookupTimer);
      const timer = setTimeout(async () => {
        try {
          const res = await api.get('/api/lookup/appliances', { params: { q: value } });
  
          if (Array.isArray(res.data) && res.data.length > 0) {
            setSuggestions(res.data);
            setShowSuggestions(true);
          } else {
            // Fallback to AI suggestion if DB returned nothing
            const aiRes = await api.get('/api/ai/lookup-appliance', { params: { q: value } });
            if (Array.isArray(aiRes.data)) {
              setSuggestions(aiRes.data);
              setShowSuggestions(aiRes.data.length > 0);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        } catch (err) {
          console.error('Lookup failed:', err);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 400);
      setLookupTimer(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  

  const applySuggestion = (sugg: ApplianceLookup) => {
    setForm(prev => ({
      ...prev,
      name: `${sugg.brand} ${sugg.model}`,
      brand: sugg.brand,
      model: sugg.model,
      type: sugg.type,
      category: sugg.category as TrackableCategory,
      notes: sugg.notes || '',
      image: sugg.imageUrl || '',
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const cleanedForm = {
      ...form,
      name: sanitize(form.name),
      brand: sanitize(form.brand),
      model: sanitize(form.model),
      serialNumber: sanitize(form.serialNumber ?? ''),
      notes: sanitize(form.notes ?? ''),
    };

    onSave(cleanedForm);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✖️
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {initialData ? 'Edit Trackable' : 'Add New Trackable'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              name="name"
              autoComplete="off"
              value={form.name}
              onChange={handleChange}
              placeholder="Name (e.g., Bosch SilencePlus)"
              required
              className="w-full border rounded px-3 py-2"
            />
            {showSuggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-40 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => applySuggestion(s)}
                    className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    <strong>{s.brand}</strong> {s.model}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <input
            name="type"
            autoComplete="off"
            value={form.type}
            onChange={handleChange}
            placeholder="Type (e.g., Dishwasher)"
            className="w-full border rounded px-3 py-2"
          />

          <input
            name="brand"
            autoComplete="off"
            value={form.brand}
            onChange={handleChange}
            placeholder="Brand"
            className="w-full border rounded px-3 py-2"
          />

          <input
            name="model"
            autoComplete="off"
            value={form.model}
            onChange={handleChange}
            placeholder="Model"
            className="w-full border rounded px-3 py-2"
          />

          <input
            name="serialNumber"
            autoComplete="off"
            value={form.serialNumber}
            onChange={handleChange}
            placeholder="Serial Number"
            className="w-full border rounded px-3 py-2"
          />

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes"
            rows={3}
            className="w-full border rounded px-3 py-2"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600">Save Trackable</button>
          </div>
        </form>
      </div>
    </div>
  );
}
