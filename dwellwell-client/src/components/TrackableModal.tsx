import { useState, useEffect } from 'react';
import type { Trackable, TrackableCategory } from '../types/trackable';
import { applianceLookup } from '../data/mockApplianceLookup';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trackable: Trackable) => void;
  initialData?: Trackable | null;
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
    name: '',
    type: '',
    category: 'general',
    brand: '',
    model: '',
    serialNumber: '',
    imageUrl: '',
    notes: '',
  });

  const [suggestions, setSuggestions] = useState<typeof applianceLookup>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        id: uuidv4(),
        name: '',
        type: '',
        category: 'general',
        brand: '',
        model: '',
        serialNumber: '',
        imageUrl: '',
        notes: '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen && !initialData) {
      setForm({
        id: uuidv4(),
        name: '',
        type: '',
        category: 'general',
        brand: '',
        model: '',
        serialNumber: '',
        imageUrl: '',
        notes: '',
      });
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen, initialData]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      if (value.length >= 3) {
        const filtered = applianceLookup.filter(entry =>
          `${entry.brand} ${entry.model}`.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }
  };

  const applySuggestion = (suggestion: (typeof applianceLookup)[0]) => {
    setForm(prev => ({
      ...prev,
      name: `${suggestion.brand} ${suggestion.model}`,
      brand: suggestion.brand,
      model: suggestion.model,
      type: suggestion.type,
      category: suggestion.category as TrackableCategory,
      notes: suggestion.notes || '',
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

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
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-40 overflow-y-auto">
                {suggestions.map((sugg, idx) => (
                  <li
                    key={idx}
                    onClick={() => applySuggestion(sugg)}
                    className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    <strong>{sugg.brand}</strong> {sugg.model}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input name="type" autoComplete='off' value={form.type} onChange={handleChange} placeholder="Type" className="w-full border rounded px-3 py-2" />
          <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2">
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <input name="brand" autoComplete='off' value={form.brand} onChange={handleChange} placeholder="Brand" className="w-full border rounded px-3 py-2" />
          <input name="model" autoComplete='off' value={form.model} onChange={handleChange} placeholder="Model" className="w-full border rounded px-3 py-2" />
          <input name="serialNumber" autoComplete='off' value={form.serialNumber} onChange={handleChange} placeholder="Serial Number" className="w-full border rounded px-3 py-2" />
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" className="w-full border rounded px-3 py-2" />
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" rows={3} className="w-full border rounded px-3 py-2" />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600">Save Trackable</button>
          </div>
        </form>
      </div>
    </div>
  );
}