// src/components/AddHomeModal.tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProgressBar } from './ui/ProgressBar';
import { api } from '@/utils/api';

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsRaw, setSuggestionsRaw] = useState<any[]>([]);
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [nickname, setNickname] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [rooms, setRooms] = useState(ROOM_TYPES.map((type) => ({ type, count: 0 })));


  const steps = ['Address', 'Details', 'Features'];

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSave = async () => {
    try {
      const numberOfRooms = rooms.reduce((sum, r) => sum + (r.count || 0), 0);

      const res = await api.post('/api/homes', {
        address,
        city,
        state,
        nickname,
        squareFeet: Number(squareFeet) || null,
        lotSize: Number(lotSize) || null,
        yearBuilt: Number(yearBuilt) || null,
        numberOfRooms,
        features,
        imageUrl: null,
      });

      console.log('✅ Home saved:', res.data);
      onClose();
    } catch (err) {
      console.error('❌ Failed to save home:', err);
    }
  };

  const handleAddressChange = async (value: string) => {
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



  const handleSuggestionClick = (suggestion: string, context: any[]) => {
    setAddress(suggestion);

    // Reset first
    setCity('');
    setState('');

    for (const item of context) {
      if (item.id.startsWith('place.')) {
        setCity(item.text);
      } else if (item.id.startsWith('region.') && item.short_code) {
        setState(item.short_code.replace('US-', ''));
      }
    }

    setSuggestions([]);
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
              <Input
                placeholder="Street Address"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-50 bg-white border rounded shadow w-full max-h-40 overflow-auto">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      onClick={() => handleSuggestionClick(suggestionsRaw[i].place_name, suggestionsRaw[i].context || [])}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label>Tell us more about this home</label>
            <Input
              placeholder="Nickname (e.g. Lake House)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Input
              placeholder="Square Feet"
              type="number"
              value={squareFeet}
              onChange={(e) => setSquareFeet(e.target.value)}
            />
            <Input
              placeholder="Lot Size (acres)"
              type="number"
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
            />
            <Input
              placeholder="Year Built"
              type="number"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
            />
            <div className="flex justify-between">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Home Features</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. garage"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                />
                <button
                  onClick={addFeature}
                  className="px-3 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {features.map((f) => (
                    <span
                      key={f}
                      className="bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-full border border-gray-300"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">Rooms in your home</label>
              <div className="space-y-2">
                {rooms.map((room, i) => (
                  <div key={room.type} className="flex justify-between items-center">
                    <span>{room.type}</span>
                    <input
                      type="number"
                      value={room.count}
                      min={0}
                      onChange={(e) => {
                        const updated = [...rooms];
                        updated[i].count = parseInt(e.target.value || '0');
                        setRooms(updated);
                      }}
                      className="w-16 border rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
