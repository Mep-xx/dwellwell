// src/components/AddHomeModal.tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProgressBar } from './ui/ProgressBar';
import { api } from '@/utils/api';
import { useEffect, useRef, useState } from 'react';
import { architecturalStyleLabels } from '../../../shared/architecturalStyleLabels';

const FEATURE_SUGGESTIONS = [
  'garage', 'fireplace', 'deck', 'patio', 'sunroom', 'chimney',
  'attic', 'basement', 'walk-in closet', 'central air', 'finished basement',
];

const ROOM_TYPES = [
  'Bedroom', 'Bathroom', 'Kitchen', 'Dining Room', 'Living Room',
  'Office', 'Laundry Room', 'Mudroom', 'Guest Room',
];

export function AddHomeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [nickname, setNickname] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [rooms, setRooms] = useState<{ name: string; type: string; floor?: number }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsRaw, setSuggestionsRaw] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [architecturalStyle, setArchitecturalStyle] = useState('');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const steps = ['Address', 'Details', 'Features', 'Rooms'];

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(0);
    setAddress('');
    setCity('');
    setState('');
    setNickname('');
    setSquareFeet('');
    setLotSize('');
    setYearBuilt('');
    setFeatures([]);
    setRooms([]);
    setSuggestions([]);
    setSuggestionsRaw([]);
  };

  useEffect(() => {
    if (step === 3 && rooms.length === 0) {
      setRooms([
        { name: 'Kitchen', type: 'Kitchen' },
        { name: 'Primary Bedroom', type: 'Bedroom' },
        { name: 'Bathroom', type: 'Bathroom' },
      ]);
    }
  }, [step]);

  const handleSave = async () => {
    try {
      if (saving) return; // 🛑 prevent duplicate saves
      setSaving(true);

      await api.post('/api/homes', {
        address,
        city,
        state,
        nickname,
        squareFeet: Number(squareFeet) || null,
        lotSize: Number(lotSize) || null,
        yearBuilt: Number(yearBuilt) || null,
        numberOfRooms: rooms.length,
        architecturalStyle: architecturalStyle || null,
        features,
        imageUrl: null,
        rooms,
      });

      onClose();
    } catch (err) {
      console.error('❌ Failed to save home:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setSuggestions([]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!value.trim()) return;

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mapbox/suggest?query=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestionsRaw(data.features);
        const suggestionList = data.features.map((f: any) => f.place_name);
        setSuggestions(suggestionList);
      } catch (err) {
        console.error('Backend autocomplete failed:', err);
      }
    }, 300);
  };

  const handleSuggestionClick = (place: any) => {
    const number = place.address || '';
    const street = place.text || '';
    const fullAddress = `${number} ${street}`.trim();

    setAddress(fullAddress);

    setCity('');
    setState('');
    for (const item of place.context || []) {
      if (item.id.startsWith('place.')) setCity(item.text);
      else if (item.id.startsWith('region.') && item.short_code)
        setState(item.short_code.replace('US-', ''));
    }

    setSuggestions([]);
  };

  const enrichHomeDetails = async () => {
    if (!address) return;
    try {
      setLoadingAI(true);
      const res = await api.post('/api/homes/enrich-home', { address, city, state });
      const data = res.data;
  
      if (data.squareFeet) setSquareFeet(data.squareFeet.toString());
      if (data.lotSize) setLotSize(data.lotSize.toString());
      if (data.yearBuilt) setYearBuilt(data.yearBuilt.toString());
      if (data.nickname) setNickname(data.nickname);
      if (data.architecturalStyle) setArchitecturalStyle(data.architecturalStyle); // 🆕 ADD THIS
      if (Array.isArray(data.features)) setFeatures(data.features);
      if (Array.isArray(data.rooms)) setRooms(data.rooms);
  
    } catch (err) {
      console.error('❌ Failed AI enrichment:', err);
    } finally {
      setLoadingAI(false);
    }
  };
 

  const addFeature = () => {
    const trimmed = featureInput.trim().toLowerCase();
    if (
      trimmed &&
      !features.includes(trimmed) &&
      !trimmed.includes('<') &&
      !['hot tub', 'stove', 'insert', 'range', 'furnace'].some(f => trimmed.includes(f))
    ) {
      setFeatures([...features, trimmed]);
    }
    setFeatureInput('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4 max-w-xl">
        <div className="flex flex-col space-y-1">
          <DialogTitle className="text-2xl font-bold text-brand-primary">Add a New Home</DialogTitle>
        </div>

        <div className="w-full px-2">
          <ProgressBar currentStep={step} steps={steps} />
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <DialogDescription>Where is your home located?</DialogDescription>

            <div className="relative">
              <Input placeholder="Street Address" autoComplete="new-password" value={address} onChange={(e) => handleAddressChange(e.target.value)} />
              {suggestions.length > 0 && (
                <ul className="absolute z-50 bg-white border rounded shadow w-full max-h-40 overflow-auto">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      onClick={() => handleSuggestionClick(suggestionsRaw[i])}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <Input placeholder="City" autoComplete="off" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input placeholder="State" autoComplete="off" value={state} onChange={(e) => setState(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600">Next</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label>Tell us more about this home</label>
            <Input placeholder="Nickname (e.g. Lake House)" value={nickname} onChange={(e) => setNickname(e.target.value)} />

            <div className="flex justify-start">
              <button
                onClick={enrichHomeDetails}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                disabled={loadingAI}
              >
                {loadingAI ? 'Thinking...' : '✨ Suggest Home Details'}
              </button>
            </div>

            <select
              id="style"
              value={architecturalStyle}
              onChange={(e) => setArchitecturalStyle(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select a style</option>
              {Object.keys(architecturalStyleLabels).sort().map((key) => (
                <option key={key} value={key}>
                  {architecturalStyleLabels[key]}
                </option>
              ))}
            </select>

            <Input placeholder="Square Feet" type="number" value={squareFeet} onChange={(e) => setSquareFeet(e.target.value)} />
            <Input placeholder="Lot Size (acres)" type="number" value={lotSize} onChange={(e) => setLotSize(e.target.value)} />
            <Input placeholder="Year Built" type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">Back</button>
              <button onClick={() => setStep(2)} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Home Features</label>
              <div className="flex gap-2">
                <Input placeholder="e.g. garage" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFeature()} />
                <button onClick={addFeature} className="px-3 py-2 bg-brand-primary text-white rounded hover:bg-blue-600">Add</button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {features.map((f) => (
                    <span key={f} className="bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-full border border-gray-300">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">Back</button>
              <button onClick={() => setStep(3)} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Define Your Rooms</label>
              {rooms.map((room, index) => (
                <div key={index} className="flex gap-2 items-center mb-2">
                  <Input
                    placeholder="Room Name (e.g. Master Bedroom)"
                    value={room.name}
                    onChange={(e) => {
                      const updated = [...rooms];
                      updated[index].name = e.target.value;
                      setRooms(updated);
                    }}
                  />
                  <select
                    value={room.type}
                    onChange={(e) => {
                      const updated = [...rooms];
                      updated[index].type = e.target.value;
                      setRooms(updated);
                    }}
                    className="border rounded px-2 py-1"
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Floor #"
                    type="number"
                    className="w-20"
                    value={room.floor ?? ''}
                    onChange={(e) => {
                      const updated = [...rooms];
                      updated[index].floor = parseInt(e.target.value || '0');
                      setRooms(updated);
                    }}
                  />
                  <button
                    onClick={() => {
                      const updated = [...rooms];
                      updated.splice(index, 1);
                      setRooms(updated);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                onClick={() => setRooms([...rooms, { name: '', type: 'Bedroom', floor: undefined }])}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                + Add Another Room
              </button>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">Back</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
