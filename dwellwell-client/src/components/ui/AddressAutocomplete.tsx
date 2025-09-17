// src/components/AddressAutocomplete.tsx
import * as React from 'react';
import { api } from '@/utils/api';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type AddressSuggestion = {
  id: string;
  place_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  apartment?: string;
};

// Props:
// - displayValue: formatted text to show when an address is selected (locks the field)
// - onSelectSuggestion: called with the chosen suggestion
// - onClear?: optional; if provided, shows a "Change" button that clears the selection
export function AddressAutocomplete({
  displayValue,
  onSelectSuggestion,
  onClear,
  placeholder = 'Start typing your address…',
  className,
}: {
  displayValue?: string;
  onSelectSuggestion: (s: AddressSuggestion) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [term, setTerm] = React.useState('');
  const [list, setList] = React.useState<AddressSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // If we have a displayValue (i.e., selected), lock the field and hide suggestions
  const locked = !!displayValue;

  // Debounced fetch
  React.useEffect(() => {
    if (locked) return;                 // do nothing while locked
    if (!term || term.length < 3) {
      setList([]);
      setOpen(false);
      return;
    }

    let ignore = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        // Our API expects ?q=term
        const res = await api.get('/mapbox/suggest', { params: { q: term } });
        if (!ignore) {
          setList(res.data?.features ?? res.data ?? []); // tolerate raw features or mapped array
          setOpen(true);
        }
      } catch {
        if (!ignore) {
          setList([]);
          setOpen(false);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 200);

    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [term, locked]);

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        <Input
          value={locked ? (displayValue ?? "") : term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          disabled={locked}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => { if (!locked && list.length > 0) setOpen(true); }}
          onBlur={() => { setTimeout(() => setOpen(false), 120); }}
        />
        {locked && (
          <button
            type="button"
            className="text-sm px-3 rounded border hover:bg-accent"
            onClick={() => {
              onClear?.();      // clear selection in parent
              setTerm('');      // clear local input
              setList([]);      // close list
              setOpen(false);
            }}
          >
            Change
          </button>
        )}
      </div>

      {!locked && open && (list.length > 0 || loading) && (
        <div className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-md border bg-white shadow">
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          )}
          {!loading &&
            list.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectSuggestion(s);
                  setOpen(false);
                }}
              >
                {s.place_name}
              </button>
            ))}
          {!loading && list.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
