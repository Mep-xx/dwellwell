// src/components/AddressAutocomplete.tsx
import * as React from "react";
import { api } from "@/utils/api";
import { cn } from "@/lib/utils";

export type AddressSuggestion = {
  id: string;
  place_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  apartment?: string;
};

type Props = {
  displayValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSelectSuggestion: (s: AddressSuggestion) => void;
};

export function AddressAutocomplete({
  displayValue = "",
  placeholder = "Start typing your address…",
  disabled,
  className,
  onSelectSuggestion,
}: Props) {
  const [value, setValue] = React.useState(displayValue);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<AddressSuggestion[]>([]);
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // keep input in sync if parent changes displayValue
  React.useEffect(() => {
    setValue(displayValue || "");
  }, [displayValue]);

  // click outside to close
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // debounced fetch
  React.useEffect(() => {
    let ignore = false;
    let t: number | undefined;

    if (!value || value.trim().length < 3) {
      setItems([]);
      setOpen(false);
      setActiveIdx(-1);
      return;
    }

    setLoading(true);
    t = window.setTimeout(async () => {
      try {
        const res = await api.get<AddressSuggestion[]>("/mapbox/suggest", {
          params: { q: value.trim() },
        });
        if (!ignore) {
          setItems(res.data || []);
          setOpen((res.data?.length ?? 0) > 0);
          setActiveIdx(-1);
        }
      } catch {
        if (!ignore) {
          setItems([]);
          setOpen(false);
          setActiveIdx(-1);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      if (t) window.clearTimeout(t);
    };
  }, [value]);

  function choose(idx: number) {
    const chosen = items[idx];
    if (!chosen) return;
    setValue(chosen.place_name);
    setOpen(false);
    setActiveIdx(-1);
    onSelectSuggestion(chosen);
  }

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            if (open && activeIdx >= 0) {
              e.preventDefault();
              choose(activeIdx);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIdx(-1);
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="address-autocomplete-listbox"
        role="combobox"
      />
      {loading && (
        <div className="absolute right-2 top-2 text-xs text-gray-500">…</div>
      )}
      {open && items.length > 0 && (
        <div
          id="address-autocomplete-listbox"
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md"
        >
          {items.map((s, idx) => (
            <div
              key={s.id}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseDown={(e) => e.preventDefault()} // don’t blur input
              onClick={() => choose(idx)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm hover:bg-gray-100",
                idx === activeIdx && "bg-gray-100"
              )}
            >
              {s.place_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
