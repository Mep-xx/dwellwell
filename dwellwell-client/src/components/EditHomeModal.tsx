// src/components/EditHomeModal.tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/imageupload';
import { useState, useEffect } from 'react';
import { Home } from '@shared/types/home';

const heatingCoolingOptions = [
  'Central Air',
  'Baseboard Heating',
  'Boiler (Radiators)',
  'Forced Hot Air',
  'Heat Pump',
  'Radiant Heating',
  'Ductless Mini-Split',
  'Pellet Stove',
  'Space Heater',
  'Solar Heating'
];

const suggestedFeatures = [
  'Fireplace', 'Skylight', 'Patio', 'Deck', 'Generator', 'Chimney', 'Crawlspace', 'Security System'
];

type Props = {
  isOpen: boolean;
  home: Home;
  onSave: (updatedFields: Partial<Home>) => void;
  onCancel: () => void;
};

export function EditHomeModal({ isOpen, home, onSave, onCancel }: Props) {
  const [nickname, setNickname] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [roofType, setRoofType] = useState('');
  const [sidingType, setSidingType] = useState('');
  const [boilerType, setBoilerType] = useState('');
  const [heatingCoolingTypes, setHeatingCoolingTypes] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [customFeature, setCustomFeature] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNickname(home.nickname ?? '');
      setSquareFeet(home.squareFeet?.toString() ?? '');
      setLotSize(home.lotSize?.toString() ?? '');
      setYearBuilt(home.yearBuilt?.toString() ?? '');
      setRoofType(home.roofType ?? '');
      setSidingType(home.sidingType ?? '');
      setBoilerType(home.boilerType ?? '');
      setHeatingCoolingTypes(home.heatingCoolingTypes ?? []);
      setFeatures(home.features ?? []);
      setImageUrl(home.imageUrl ?? null);
    }
  }, [isOpen, home]);

  const handleSave = () => {
    onSave({
      id: home.id,
      nickname,
      squareFeet: squareFeet ? Number(squareFeet) : null,
      lotSize: lotSize ? Number(lotSize) : null,
      yearBuilt: yearBuilt ? Number(yearBuilt) : null,
      roofType,
      sidingType,
      boilerType,
      heatingCoolingTypes,
      features,
      imageUrl,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden">
        {/* Scrollable body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          <DialogTitle className="text-2xl font-bold text-brand-primary">Edit Home</DialogTitle>
          <DialogDescription>Update your home details.</DialogDescription>

          <Input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input type="number" placeholder="Square Feet" value={squareFeet} onChange={(e) => setSquareFeet(e.target.value)} />
            <Input type="number" placeholder="Lot Size (acres)" value={lotSize} onChange={(e) => setLotSize(e.target.value)} />
            <Input type="number" placeholder="Year Built" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
          </div>

          <div className="pt-2">
            <label className="block font-medium">Heating and Cooling Systems</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {heatingCoolingOptions.map((option) => (
                <label key={option} className="text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={heatingCoolingTypes.includes(option)}
                    onChange={() => {
                      setHeatingCoolingTypes((prev) =>
                        prev.includes(option)
                          ? prev.filter((item) => item !== option)
                          : [...prev, option]
                      );
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
            <Input placeholder="Boiler Type (optional)" value={boilerType} onChange={(e) => setBoilerType(e.target.value)} className="mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="Roof Type (e.g. Asphalt Shingle)" value={roofType} onChange={(e) => setRoofType(e.target.value)} />
            <Input placeholder="Siding Type (e.g. Vinyl, Wood)" value={sidingType} onChange={(e) => setSidingType(e.target.value)} />
          </div>

          <div>
            <label className="block font-medium mb-1">Notable Features</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestedFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  className={`px-3 py-1 text-sm rounded border ${features.includes(feature) ? 'bg-brand-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => {
                    setFeatures((prev) =>
                      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
                    );
                  }}
                >
                  {features.includes(feature) ? '✓ ' : ''}{feature}
                </button>
              ))}
            </div>
            <Input
              placeholder="Add a custom feature"
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = customFeature.trim();
                  if (value && !features.includes(value)) {
                    setFeatures((prev) => [...prev, value]);
                    setCustomFeature('');
                  }
                }
              }}
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm mb-2 font-medium text-gray-700">Home Image</label>
            {imageUrl && (
              <div className="mb-3">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${imageUrl}`}
                  alt="Current Home"
                  className="rounded w-full max-h-40 object-cover"
                />
              </div>
            )}
            <ImageUpload
              homeId={home.id}
              onUploadComplete={(relativePath) => setImageUrl(`${relativePath}?t=${Date.now()}`)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}