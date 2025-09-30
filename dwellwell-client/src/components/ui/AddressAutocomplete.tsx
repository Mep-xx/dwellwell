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
  const [active, setActive] = React.useState(0);

  // a11y ids
  const listboxId = React.useId();
  const inputId = React.useId();

  const locked = !!displayValue;

  // Debounced fetch with cancellation
  React.useEffect(() => {
    if (locked) return;
    if (!term || term.length < 3) {
      setList([]);
      setOpen(false);
      return;
    }

    let ignore = false;
    const c = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/mapbox/suggest', { params: { q: term }, signal: c.signal as any });
        if (!ignore) {
          const items = (res.data?.features ?? res.data ?? []) as AddressSuggestion[];
          setList(items);
          setOpen(true);
          setActive(0);
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
      try { c.abort(); } catch {}
    };
  }, [term, locked]);

  const onPick = (s: AddressSuggestion) => {
    onSelectSuggestion(s);
    setOpen(false);
  };

  // keyboard controls (on input)
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || locked) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(list.length - 1, 0)));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === 'Enter') {
      if (list[active]) {
        e.preventDefault();
        onPick(list[active]);
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        <Input
          id={inputId}
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-autocomplete="list"
          value={locked ? (displayValue ?? '') : term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          disabled={locked}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => { if (!locked && list.length > 0) setOpen(true); }}
          onBlur={() => { setTimeout(() => setOpen(false), 120); }}
          onKeyDown={onKeyDown}
        />
        {locked && (
          <button
            type="button"
            className="text-sm px-3 rounded border border-token hover:bg-accent"
            onClick={() => {
              onClear?.();
              setTerm('');
              setList([]);
              setOpen(false);
            }}
          >
            Change
          </button>
        )}
      </div>

      {!locked && open && (list.length > 0 || loading) && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={inputId}
          className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-md border border-token bg-card shadow"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          )}
          {!loading &&
            list.map((s, idx) => {
              const isActive = idx === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    "w-full text-left px-3 py-2",
                    isActive ? "bg-muted" : "hover:bg-accent"
                  )}
                  onMouseEnter={() => setActive(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPick(s)}
                >
                  {s.place_name}
                </button>
              );
            })}
          {!loading && list.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
