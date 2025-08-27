// src/components/AddHomeWizard.tsx
import React, { useMemo, useState } from "react";
import { api } from "@/utils/api";
import type { Home } from "@shared/types/home";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AddressAutocomplete, type AddressSuggestion } from "@/components/AddressAutocomplete";
import { ARCHITECTURAL_STYLES } from "@shared/constants/architecturalStyleLabels";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: (home: Home) => void;
};

function normalizeStyles(src: unknown): string[] {
  if (Array.isArray(src)) return src.filter((s): s is string => typeof s === "string");
  if (src && typeof src === "object") return Object.values(src as Record<string, unknown>)
    .filter((s): s is string => typeof s === "string");
  return [];
}
const STYLE_OPTIONS = normalizeStyles(ARCHITECTURAL_STYLES);

export default function AddHomeWizard({ open, onOpenChange, onFinished }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [apartment, setApartment] = useState("");
  const [nickname, setNickname] = useState("");
  const [architecturalStyle, setArchitecturalStyle] = useState("");

  const displayAddress = useMemo(
    () => (selected ? selected.place_name : ""),
    [selected]
  );

  async function handleCreate() {
    setError(null);

    if (!selected) {
      setError("Please choose an address.");
      return;
    }

    // Try to provide best-guess street line if the suggestion didn’t include .address
    const line1 =
      selected.address ??
      (selected.place_name ? selected.place_name.split(",")[0]?.trim() : "");

    const payload: any = {
      address: line1,
      city: selected.city ?? "",
      state: selected.state ?? "",
      zip: selected.zip ?? "",
      apartment: apartment || undefined,
      nickname: nickname || undefined,
      architecturalStyle: architecturalStyle || undefined,
    };

    setSaving(true);
    try {
      const res = await api.post<Home>("/homes", payload);
      const newHome = res.data;

      // Best-effort: pre-seed rooms for the chosen style (ignore if endpoint is missing).
      if (architecturalStyle) {
        try {
          await api.post(`/homes/${newHome.id}/rooms/apply-style-defaults`, {
            style: architecturalStyle,
          });
        } catch {
          // non-blocking — the Edit page can still apply defaults on load / style change
        }
      }

      onOpenChange(false);
      onFinished(newHome);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not create the home.");
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    setSelected(null);
    setApartment("");
    setNickname("");
    setArchitecturalStyle("");
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAll(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Home</DialogTitle>
          <DialogDescription id="add-home-desc">
            Start with your address. You can fill in the rest on the next screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Search Address</label>
            <AddressAutocomplete
              displayValue={displayAddress}
              onSelectSuggestion={(s) => setSelected(s)}
              onClear={() => setSelected(null)}
              placeholder="Start typing your address…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Apartment (optional)</label>
              <Input
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Nickname (optional)</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">House Style (optional)</label>
            <Select
              value={architecturalStyle}
              onChange={(e) => setArchitecturalStyle(e.target.value)}
            >
              <option value="">— Select a style —</option>
              {STYLE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              If provided, we’ll pre-fill a room template for this style.
            </p>
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !selected}>
              {saving ? "Creating…" : "Create & Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
