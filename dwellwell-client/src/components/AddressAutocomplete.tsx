
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { api } from '@/utils/api';

type AddressParts = {
  displayName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

export function AddressAutocomplete({
  displayValue,
  onSelectSuggestion,
}: {
  displayValue: string;
  onSelectSuggestion: (parts: AddressParts) => void;
}) {
  const [input, setInput] = useState(displayValue || '');
  const [suggestions, setSuggestions] = useState<AddressParts[]>([]);
  const [loading, setLoading] = useState(false);
  const suppressRef = useRef(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }

    if (input.length < 5) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/mapbox/suggest', {
          params: { query: input },
        });

        const raw = res.data?.features || [];
        const mapped = raw.map((f: any): AddressParts => {
          const displayName = f.place_name;
          const addressNumber = f.address || '';
          const streetName = f.text || '';
          const address = addressNumber && streetName ? `${addressNumber} ${streetName}` : streetName;
          const city = f.context?.find((c: any) => c.id.startsWith('place'))?.text || '';
          const state = f.context?.find((c: any) => c.id.startsWith('region'))?.text || '';
          const zip = f.context?.find((c: any) => c.id.startsWith('postcode'))?.text || '';
          return { displayName, address, city, state, zip };
        });

        setSuggestions(mapped);
        setDropdownVisible(true);
      } catch (err) {
        console.error('Failed to get suggestions', err);
        setSuggestions([]);
        setDropdownVisible(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [input]);

  const handleSelect = (suggestion: AddressParts) => {
    suppressRef.current = true;
    setInput(suggestion.displayName);
    onSelectSuggestion(suggestion);
    setSuggestions([]);
    setDropdownVisible(false);
  };

  return (
    <div className="relative">
      <Input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setDropdownVisible(false);
        }}
        autoComplete="new-password"
        placeholder="Start typing your address..."
      />

      {dropdownVisible && suggestions.length > 0 && (
        <ul className="absolute bg-white border border-gray-300 mt-1 w-full rounded z-10 max-h-60 overflow-auto shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelect(s)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {s.displayName}
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="text-sm text-gray-500 mt-1">Looking up suggestions...</p>}
    </div>
  );
}
