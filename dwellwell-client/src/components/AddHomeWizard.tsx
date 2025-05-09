import axios from 'axios';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProgressBar } from './ui/progressbar';
import { api } from '@/utils/api';
import { AddressAutocomplete } from './AddressAutocomplete';
import { ImageUpload } from './ui/imageupload';
import { RoomTypeSelect } from '@/components/RoomTypeSelect';
import { ROOM_TYPES, ROOM_TYPE_ICONS } from '@shared/constants/roomTypes';
import { houseRoomTemplates } from '@shared/houseRoomTemplates';
import { floorToLabel, labelToFloor } from '@/utils/floorHelpers'; // adjust path
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import { SortableRoomCard } from './SortableRoomCard'; // You’ll create this to support DnD rooms

export function AddHomeWizard({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const steps = ['Address', 'Home Info', 'Rooms', 'Features', 'Photo', 'Summary'];
  const [step, setStep] = useState(0);

  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [state, setState] = useState('');
  const [nickname, setNickname] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [boilerType, setBoilerType] = useState('');
  const [heatingCoolingTypes, setHeatingCoolingTypes] = useState<string[]>([]);
  const [roofType, setRoofType] = useState('');
  const [sidingType, setSidingType] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [rooms, setRooms] = useState<{ name: string; type: string; floor?: number }[]>([]);
  const [architecturalStyle, setArchitecturalStyle] = useState('');
  const [imageUploadedUrl, setImageUploadedUrl] = useState('');
  const [addressSelected, setAddressSelected] = useState(false);
  const [newHomeId, setNewHomeId] = useState<string | null>(null);
  const [homeCreated, setHomeCreated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const resetWizard = () => {
    setStep(0);
    setAddress('');
    setApartment('');
    setCity('');
    setZip('');
    setState('');
    setNickname('');
    setSquareFeet('');
    setLotSize('');
    setYearBuilt('');
    setBoilerType('');
    setHeatingCoolingTypes([]);
    setRoofType('');
    setSidingType('');
    setFeatures([]);
    setRooms([]);
    setArchitecturalStyle('');
    setImageUploadedUrl('');
    setAddressSelected(false);
    setNewHomeId(null);
    setHomeCreated(false);
    setSaving(false);
    setSaveError(null);
  };

  const handleSaveHome = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const normalizeFloor = (floor: string | undefined): number | null => {
        switch (floor) {
          case 'Basement': return -1;
          case '1st Floor': return 1;
          case '2nd Floor': return 2;
          case '3rd Floor': return 3;
          case 'Attic': return 99;
          case 'Other': return 0;
          default: return null;
        }
      };

      const transformedRooms = rooms.map((room) => ({
        ...room,
        floor: normalizeFloor(floorToLabel(room.floor)),
      }));

      const res = await api.post('/api/homes', {
        address,
        apartment,
        city,
        state,
        zip,
        nickname,
        squareFeet: Number(squareFeet) || null,
        lotSize: Number(lotSize) || null,
        yearBuilt: Number(yearBuilt) || null,
        architecturalStyle,
        boilerType,
        heatingCoolingTypes,
        roofType,
        sidingType,
        features,
        rooms: transformedRooms,
        isChecked: true,
      });

      setNewHomeId(res.data.id);
      setHomeCreated(true);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setSaveError('A home at this address already exists.');
      } else {
        setSaveError('Failed to save home. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDisplayAddress = (parts: string[]) => parts.filter(Boolean).join(', ');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetWizard();
          onClose();
        }
      }}
    >
      <DialogContent className="space-y-4 !max-w-4xl w-full" aria-describedby="home-wizard-description">
        <DialogTitle className="text-2xl font-bold text-brand-primary">Add a New Home</DialogTitle>
        <DialogDescription>
          Fill out the steps to add and describe your home.
        </DialogDescription>
        <ProgressBar currentStep={step} steps={steps} />


        {/* STEP 0: Address */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter your address so we can personalize tasks like lawn care and regional upkeep.</p>
            <label className="block font-medium">Start typing your address</label>
            <AddressAutocomplete
              displayValue={formatDisplayAddress([address, city, state]) + (zip ? ' ' + zip : '')}
              onSelectSuggestion={({ address, city, state, zip }) => {
                setAddress(address);
                setCity(city);
                setState(state);
                setZip(zip);
                setAddressSelected(true);
              }}
            />
            <hr className="my-4" />
            <p className="text-sm font-medium">Or enter your address manually:</p>
            <Input placeholder="Street Address" value={address} onChange={(e) => {
              setAddress(e.target.value);
              setAddressSelected(false);
            }} disabled={addressSelected} />
            <Input placeholder="Apartment / Unit (optional)" value={apartment} onChange={(e) => setApartment(e.target.value)} disabled={addressSelected} />
            <div className="flex flex-wrap gap-2">
              <Input className="flex-1" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={addressSelected} />
              <select value={state} onChange={(e) => setState(e.target.value)} className="border rounded px-3 py-2 text-sm w-[100px]" disabled={addressSelected}>
                <option value="">State</option>
                {['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].map((abbr) => (
                  <option key={abbr} value={abbr}>{abbr}</option>
                ))}
              </select>
              <Input className="w-[100px]" placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} disabled={addressSelected} />
            </div>
          </div>
        )}

        {/* STEP 1: Home Info */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Tell us how your home is heated and cooled. You can skip anything you're unsure about.</p>
            <Input placeholder="Home Nickname (optional)" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input type="number" placeholder="Square Feet" value={squareFeet} onChange={(e) => setSquareFeet(e.target.value)} />
              <Input type="number" placeholder="Lot Size (acres)" value={lotSize} onChange={(e) => setLotSize(e.target.value)} />
              <Input type="number" placeholder="Year Built" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
            </div>

            {/* HVAC */}
            <div className="pt-4 space-y-2">
              <label className="block font-medium">Heating and Cooling Systems</label>
              <div className="grid grid-cols-2 gap-2">
                {['Central Air', 'Baseboard Heating', 'Boiler (Radiators)', 'Forced Hot Air', 'Heat Pump', 'Radiant Heating', 'Ductless Mini-Split', 'Pellet Stove', 'Space Heater', 'Solar Heating'].map((option) => (
                  <label key={option} className="text-sm">
                    <input type="checkbox" className="mr-2" checked={heatingCoolingTypes.includes(option)} onChange={() => {
                      setHeatingCoolingTypes((prev) => prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]);
                    }} />
                    {option}
                  </label>
                ))}
              </div>
              <select
                value={boilerType}
                onChange={(e) => setBoilerType(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              >
                <option value="">Select Boiler Type</option>
                <option value="Steam">Steam</option>
                <option value="Hot Water">Hot Water</option>
                <option value="Combination (Combi)">Combination (Combi)</option>
                <option value="Condensing">Condensing</option>
                <option value="Electric">Electric</option>
                <option value="Oil-Fired">Oil-Fired</option>
                <option value="Gas-Fired">Gas-Fired</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Roof + Siding */}
            <div className="pt-4 space-y-2">
              <label className="block font-medium">Roof Type</label>
              <select value={roofType} onChange={(e) => setRoofType(e.target.value)} className="border rounded px-3 py-2 text-sm w-full">
                <option value="">Select Roof Type</option>
                <option value="Asphalt Shingle">Asphalt Shingle</option>
                <option value="Metal">Metal</option>
                <option value="Clay Tile">Clay Tile</option>
                <option value="Slate">Slate</option>
                <option value="Wood Shake">Wood Shake</option>
                <option value="Rubber">Rubber (EPDM)</option>
                <option value="Flat">Flat / Built-up</option>
                <option value="Other">Other</option>
              </select>

              <label className="block font-medium mt-2">Siding Type</label>
              <select value={sidingType} onChange={(e) => setSidingType(e.target.value)} className="border rounded px-3 py-2 text-sm w-full">
                <option value="">Select Siding Type</option>
                <option value="Vinyl">Vinyl</option>
                <option value="Wood">Wood</option>
                <option value="Fiber Cement">Fiber Cement (Hardie)</option>
                <option value="Stucco">Stucco</option>
                <option value="Brick">Brick</option>
                <option value="Stone">Stone</option>
                <option value="Metal">Metal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Rooms */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="block font-medium">Architectural Style</label>
            <select
              value={architecturalStyle}
              onChange={(e) => {
                const style = e.target.value;
                setArchitecturalStyle(style);
                if (style !== 'Other' && houseRoomTemplates[style]) {
                  setRooms(
                    houseRoomTemplates[style].map((r) => ({ ...r, floor: r.floor ?? 1 }))
                  );
                } else {
                  setRooms([]);
                }
              }}
              className="border rounded px-3 py-2 text-sm w-full"
            >
              <option value="">Select Style</option>
              {Object.keys(houseRoomTemplates).map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
              <option value="Other">Other</option>
            </select>

            {/* Quick Add */}
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRooms([...rooms, { name: '', type, floor: 1 }])}
                  className="flex items-center gap-1 border px-3 py-1 rounded"
                >
                  <span>{ROOM_TYPE_ICONS[type] ?? '📦'}</span> {type}
                </button>
              ))}
            </div>

            {/* Drag-and-Drop Room Editor */}
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }: DragEndEvent) => {
                  if (active.id !== over?.id) {
                    const oldIndex = Number(active.id);
                    const newIndex = Number(over?.id);
                    setRooms((rooms) => arrayMove(rooms, oldIndex, newIndex));
                  }
                }}
              >
                {Array.from(
                  new Set(
                    rooms
                      .map((r) => floorToLabel(r.floor))
                      .filter(Boolean)
                      .concat(['Basement', '1st Floor', '2nd Floor', '3rd Floor', 'Attic', 'Other'])
                  )
                ).map((floorLabel) => {
                  const grouped = rooms
                    .map((r, index) => ({ ...r, _index: index })) // carry index
                    .filter((r) => floorToLabel(r.floor) === floorLabel);

                  if (grouped.length === 0) return null;

                  return (
                    <div key={floorLabel} className="space-y-2">
                      <div className="sticky top-0 z-10 bg-white border-b py-1">
                        <h4 className="font-semibold text-sm text-brand-primary">{floorLabel}</h4>
                      </div>

                      <SortableContext
                        items={grouped.map((r) => r._index)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {grouped.map(({ _index, ...room }) => (
                            <SortableRoomCard
                              key={_index}
                              id={_index}
                              room={room}
                              onChange={(updated) => {
                                const updatedRooms = [...rooms];
                                updatedRooms[_index] = updated;
                                setRooms(updatedRooms);
                              }}
                              onRemove={() => {
                                const updatedRooms = rooms.filter((_, i) => i !== _index);
                                setRooms(updatedRooms);
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </DndContext>
            </div>
          </div>
        )}


        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add any notable features about your home. This helps personalize future maintenance suggestions.
            </p>

            {/* Suggested Feature Buttons */}
            <div className="flex flex-wrap gap-2">
              {['Fireplace', 'Skylight', 'Patio', 'Deck', 'Generator', 'Chimney', 'Crawlspace', 'Security System'].map((feature) => (
                <button
                  key={feature}
                  type="button"
                  className={`px-3 py-1 text-sm rounded border ${features.includes(feature)
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  onClick={() => {
                    setFeatures((prev) =>
                      prev.includes(feature)
                        ? prev.filter((f) => f !== feature)
                        : [...prev, feature]
                    );
                  }}
                >
                  {features.includes(feature) ? '✓ ' : ''}{feature}
                </button>
              ))}
            </div>

            {/* Manual Feature Entry */}
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Add a custom feature"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !features.includes(value)) {
                      setFeatures((prev) => [...prev, value]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>

            {/* Current Features List */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {features.map((f, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-200 px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    {f}
                    <button
                      onClick={() =>
                        setFeatures((prev) => prev.filter((x) => x !== f))
                      }
                      className="text-red-500 hover:underline ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Add a photo of your home to recognize it easily later (optional).
            </p>

            {!newHomeId ? (
              <p className="text-sm text-red-600">
                ⚠️ Please complete the previous steps before uploading a photo.
              </p>
            ) : (
              <>
                <label className="block mb-2 font-medium">Upload a Home Photo</label>
                <ImageUpload
                  homeId={newHomeId}
                  onUploadComplete={(filename) => {
                    setImageUploadedUrl(filename);
                    api.patch(`/api/homes/${newHomeId}`, { imageUrl: filename }).catch(console.error);
                  }}
                />

                {imageUploadedUrl && (
                  <>
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${imageUploadedUrl}`}
                      alt="Preview"
                      className="mt-3 rounded w-full max-h-48 object-cover"
                    />
                    <p className="text-sm text-green-700 mt-2">✅ Your home photo has been saved!</p>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-2 text-sm">
            <p><strong>Address:</strong> {address}{apartment ? ` Apt ${apartment}` : ''}, {city}, {state} {zip}</p>
            <p><strong>HVAC:</strong> {heatingCoolingTypes.join(', ') || 'None specified'}, Boiler: {boilerType || 'N/A'}</p>
            <p><strong>Exterior:</strong> Roof: {roofType}, Siding: {sidingType}</p>
            <p>
              <strong>Rooms:</strong>{' '}
              {rooms.map(r => {
                const label = r.name ? `${r.name} (${r.type})` : r.type;
                return r.floor ? `${label} [${floorToLabel(r.floor)}]` : label;
              }).join(', ')}
            </p>
            <p><strong>Features:</strong> {features.join(', ')}</p>
          </div>
        )}

        {saveError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm border border-red-300">
            {saveError}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <div />
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Back
              </button>
            )}
            {step === steps.length - 1 ? (
              <button
                onClick={() => {
                  resetWizard();
                  onClose();
                  onComplete?.(); // e.g., refresh home list
                }}
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (step === 2 && !newHomeId) {
                    await handleSaveHome();
                  }
                  setStep((prev) => Math.min(prev + 1, steps.length - 1));
                }}
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
}