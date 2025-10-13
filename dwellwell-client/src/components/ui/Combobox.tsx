// dwellwell-client/src/components/ui/Combobox.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export type ComboOption = { value: string; label: string };

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = "Search…",
  allowCustom = false,
  className = "",
  emptyText = "No matches",
  "aria-label": ariaLabel,
}: {
  options: ComboOption[];
  value: string | null | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
  emptyText?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listboxId = useRef(`combo-${Math.random().toString(36).slice(2)}`).current;

  const selected = options.find(o => o.value === (value ?? "")) || null;

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return options;
    return options.filter(o => norm(o.label).includes(q) || norm(o.value).includes(q));
  }, [options, query]);

  const commit = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      {/* TRIGGER */}
      <div
        ref={triggerRef}
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(v => !v);
          }
        }}
        className="w-full cursor-pointer rounded border border-token bg-card px-3 py-2 text-left"
      >
        <div className="flex items-center justify-between">
          <span className={selected ? "" : "text-muted"}>
            {selected ? selected.label : "Select a type…"}
          </span>

          <div className="flex items-center gap-1">
            {selected && (
              <button
                type="button"
                className="mr-1 text-muted-foreground hover:text-body"
                onClick={(e) => { e.stopPropagation(); commit(""); }}
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded border border-token bg-card shadow-lg">
          <div className="border-b border-token p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              placeholder={placeholder}
              className="w-full rounded border border-token bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              aria-controls={listboxId}
              aria-expanded={open}
              aria-autocomplete="list"
            />
          </div>

          <ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-auto py-1"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, (allowCustom ? filtered.length : filtered.length - 1))); }
              if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
              if (e.key === "Enter") {
                e.preventDefault();
                if (allowCustom && filtered.length === 0 && query.trim()) return commit(query.trim());
                const target = filtered[active];
                if (target) commit(target.value);
              }
            }}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {allowCustom && query.trim()
                  ? <>Use “<span className="font-medium">{query.trim()}</span>”</>
                  : emptyText}
              </li>
            ) : (
              filtered.map((o, idx) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(o.value)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                    idx === active ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <span>{o.label}</span>
                  {o.value === value && <Check className="h-4 w-4 text-emerald-600" />}
                </li>
              ))
            )}

            {allowCustom && filtered.length > 0 && query.trim() && !filtered.some(o => norm(o.label) === norm(query)) && (
              <li
                className="cursor-pointer border-t border-token px-3 py-2 text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(query.trim())}
              >
                Use “<span className="font-medium">{query.trim()}</span>”
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
