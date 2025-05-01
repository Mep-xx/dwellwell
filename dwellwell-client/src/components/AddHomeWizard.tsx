
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProgressBar } from './ui/progressbar';
import { api } from '@/utils/api';
import { AddressAutocomplete } from './AddressAutocomplete';

export function AddHomeWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const steps = ['Address', 'HVAC', 'Exterior', 'Rooms', 'Features', 'Summary'];
  const [step, setStep] = useState(0);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [state, setState] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [nickname, setNickname] = useState('');
  const [assumedFields, setAssumedFields] = useState<string[]>([]);

  const [boilerType, setBoilerType] = useState('');
  const [hasCentralAir, setHasCentralAir] = useState(false);
  const [hasBaseboard, setHasBaseboard] = useState(false);

  const [roofType, setRoofType] = useState('');
  const [sidingType, setSidingType] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [rooms, setRooms] = useState<{ name: string; type: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const handleEnrich = async () => {
    try {
      setEnriching(true);
      const res = await api.post('/api/homes/enrich-home', {
        address,
        city,
        state,
      });

      const enriched = res.data;
      setNickname(enriched.nickname || '');
      setSquareFeet(enriched.squareFeet?.toString() || '');
      setYearBuilt(enriched.yearBuilt?.toString() || '');
      setLotSize(enriched.lotSize?.toString() || '');
      setFeatures(enriched.features || []);
      setRooms(enriched.rooms || []);
      setAssumedFields(enriched.assumedFields || []);
    } catch (err) {
      console.error('❌ AI enrichment failed:', err);
    } finally {
      setEnriching(false);
    }
  };

  const handleSaveHome = async () => {
    try {
      setSaving(true);
      const res = await api.post('/api/homes', {
        address,
        city,
        state,
        zip,
        nickname,
        squareFeet: Number(squareFeet) || null,
        lotSize: Number(lotSize) || null,
        yearBuilt: Number(yearBuilt) || null,
        features,
        rooms,
        boilerType,
        hasCentralAir,
        hasBaseboard,
        roofType,
        sidingType,
      });
      console.log('✅ Home saved:', res.data);
      onClose();
    } catch (err) {
      console.error('❌ Failed to save home:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (!newAddress) {
      setCity('');
      setState('');
      setZip('');
      setNickname('');
      setSquareFeet('');
      setYearBuilt('');
      setLotSize('');
      setFeatures([]);
      setRooms([]);
      setAssumedFields([]);
    }
  };

  const formatDisplayAddress = (parts: string[]) => parts.filter(Boolean).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4 max-w-2xl">
        <DialogTitle className="text-2xl font-bold text-brand-primary">Add a New Home</DialogTitle>
        <ProgressBar currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <label className="block">Where is your home located?</label>

            <AddressAutocomplete
              displayValue={formatDisplayAddress([address, city, state]) + (zip ? ' ' + zip : '')}
              onSelectSuggestion={({ address, city, state, zip }) => {
                setAddress(address);
                setCity(city);
                setState(state);
                setZip(zip);
              }}
            />

            <Input
              placeholder="Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <Input
                className="flex-1"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-[100px]"
              >
                <option value="">State</option>
                {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
                  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
                  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
                  'VA','WA','WV','WI','WY'].map((abbr) => (
                    <option key={abbr} value={abbr}>{abbr}</option>
                ))}
              </select>
              <Input
                className="w-[100px]"
                placeholder="ZIP"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label className="block">Heating and Cooling</label>
            <label><input type="checkbox" checked={hasCentralAir} onChange={() => setHasCentralAir(!hasCentralAir)} /> Central Air</label>
            <label><input type="checkbox" checked={hasBaseboard} onChange={() => setHasBaseboard(!hasBaseboard)} /> Baseboard Heating</label>
            <Input placeholder="Boiler Type (optional)" value={boilerType} onChange={(e) => setBoilerType(e.target.value)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block">Exterior Details</label>
            <Input placeholder="Roof Type (e.g. Asphalt Shingle)" value={roofType} onChange={(e) => setRoofType(e.target.value)} />
            <Input placeholder="Siding Type (e.g. Vinyl, Wood)" value={sidingType} onChange={(e) => setSidingType(e.target.value)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <label className="block">Add Rooms</label>
            {rooms.map((room, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Room Name" value={room.name} onChange={(e) => {
                  const updated = [...rooms];
                  updated[i].name = e.target.value;
                  setRooms(updated);
                }} />
                <Input placeholder="Room Type (e.g. Kitchen)" value={room.type} onChange={(e) => {
                  const updated = [...rooms];
                  updated[i].type = e.target.value;
                  setRooms(updated);
                }} />
                <button onClick={() => setRooms(rooms.filter((_, idx) => idx !== i))} className="text-red-500">✖</button>
              </div>
            ))}
            <button onClick={() => setRooms([...rooms, { name: '', type: '' }])} className="text-blue-600 text-sm mt-2">+ Add Room</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <label className="block">Home Features</label>
            <Input placeholder="Add a feature" onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                setFeatures([...features, e.currentTarget.value.trim()]);
                e.currentTarget.value = '';
              }
            }} />
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <span key={f} className="bg-gray-100 text-sm px-3 py-1 rounded-full">
                  {f} <button onClick={() => setFeatures(features.filter(feat => feat !== f))}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-2 text-sm">
            <p><strong>Address:</strong> {address}, {city}, {state}</p>
            <p><strong>Nickname:</strong> {nickname}</p>
            <p><strong>HVAC:</strong> Central Air: {hasCentralAir ? 'Yes' : 'No'}, Baseboard: {hasBaseboard ? 'Yes' : 'No'}, Boiler: {boilerType}</p>
            <p><strong>Exterior:</strong> Roof: {roofType}, Siding: {sidingType}</p>
            <p><strong>Rooms:</strong> {rooms.map(r => r.name || r.type).join(', ')}</p>
            <p><strong>Features:</strong> {features.join(', ')}</p>
            {assumedFields.length > 0 && (
              <p className="text-yellow-600">⚠️ AI Assumed: {assumedFields.join(', ')}</p>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Back
          </button>
          {step === steps.length - 1 ? (
            <button
              onClick={handleSaveHome}
              className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Finish'}
            </button>
          ) : (
            <button
              onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
              className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          )}
        </div>

        <div className="text-right pt-2">
          <button onClick={handleSaveHome} className="text-sm text-blue-600 hover:underline">💾 Save Home Now</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
