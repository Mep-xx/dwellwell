// src/components/AddHomeWizard.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import type { Home } from "@shared/types/home";
import { AddressAutocomplete, type AddressSuggestion } from "@/components/AddressAutocomplete";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import ImageUpload from "@/components/ui/imageupload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onFinished: (home: Home) => void;
};

type Form = {
  id?: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  nickname?: string;
  architecturalStyle?: string;
  squareFeet?: number | "";
  lotSize?: number | "";
  yearBuilt?: number | "";
  hasCentralAir?: boolean;
  hasBaseboard?: boolean;
  imageUrl?: string;
};

const STYLE_OPTIONS = [
  "Colonial",
  "Cape Cod",
  "Ranch",
  "Split-Level",
  "Victorian",
  "Tudor",
  "Craftsman",
  "Contemporary",
  "Modern Farmhouse",
  "Other",
];

function ensureNumber(v: number | string | undefined | null): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export default function AddHomeWizard({ open, onOpenChange, onFinished }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    nickname: "",
    architecturalStyle: "",
    squareFeet: "",
    lotSize: "",
    yearBuilt: "",
    hasCentralAir: undefined,
    hasBaseboard: undefined,
    imageUrl: "",
  });

  // reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep(0);
      setForm({
        address: "",
        apartment: "",
        city: "",
        state: "",
        zip: "",
        nickname: "",
        architecturalStyle: "",
        squareFeet: "",
        lotSize: "",
        yearBuilt: "",
        hasCentralAir: undefined,
        hasBaseboard: undefined,
        imageUrl: "",
      });
      setSaving(false);
    }
  }, [open]);

  // ---- Step 0: address selected with autocomplete ----
  const addressDisplay = useMemo(() => {
    const parts = [form.address, form.city, form.state, form.zip].filter(Boolean);
    return parts.join(", ");
  }, [form.address, form.city, form.state, form.zip]);

  async function handleUseThisAddress() {
    setSaving(true);
    try {
      const payload = {
        address: form.address,
        apartment: form.apartment || undefined,
        city: form.city,
        state: form.state,
        zip: form.zip,
        nickname: form.nickname || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      const res = await api.post<Home>("/homes", payload);
      const created = res.data;
      setForm((p) => ({ ...p, id: created.id }));
      setStep(1);
    } catch (err) {
      console.error("Failed to create home", err);
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 1: basics / style ----
  async function saveBasicsAndNext() {
    if (!form.id) return;
    setSaving(true);
    try {
      const payload = {
        nickname: form.nickname || undefined,
        architecturalStyle: form.architecturalStyle || undefined,
        squareFeet: ensureNumber(form.squareFeet),
        lotSize: ensureNumber(form.lotSize),
        yearBuilt: ensureNumber(form.yearBuilt),
        hasCentralAir: form.hasCentralAir,
        hasBaseboard: form.hasBaseboard,
      };
      await api.put(`/homes/${form.id}`, payload);
      setStep(2);
    } catch (err) {
      console.error("Failed to update basics", err);
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 2: confirm (summary) ----
  async function finalizeAndNext() {
    setStep(3);
  }

  // ---- Step 3: upload image then finish ----
  function handleImageUploaded(url: string) {
    setForm((p) => ({ ...p, imageUrl: url }));
  }

  async function finish() {
    if (form.id && form.imageUrl) {
      try {
        await api.put(`/homes/${form.id}`, { imageUrl: form.imageUrl });
      } catch (err) {
        console.warn("Could not persist imageUrl; continuing", err);
      }
    }
    if (form.id) {
      try {
        const res = await api.get<Home>(`/homes/${form.id}`);
        onFinished(res.data);
      } catch {
        onFinished({
          id: form.id!,
          address: form.address,
          apartment: form.apartment || null,
          city: form.city,
          state: form.state,
          zip: form.zip,
          nickname: form.nickname || null,
          imageUrl: form.imageUrl || null,
          // other fields omitted
        } as unknown as Home);
      }
    }
    onOpenChange(false);
  }

  const canUseAddress = Boolean(form.address && form.city && form.state && form.zip);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a home</DialogTitle>
          <DialogDescription>Step {step + 1} of 4</DialogDescription>
        </DialogHeader>

        {/* STEP 0 - address */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Search Address</label>
              <AddressAutocomplete
                displayValue={addressDisplay}
                onSelectSuggestion={(s: AddressSuggestion) => {
                  setForm((p) => ({
                    ...p,
                    address: s.address ?? p.address,
                    apartment: s.apartment ?? "",
                    city: s.city ?? "",
                    state: s.state ?? "",
                    zip: s.zip ?? "",
                  }));
                }}
                onClear={() => {
                  setForm((p) => ({
                    ...p,
                    address: "",
                    apartment: "",
                    city: "",
                    state: "",
                    zip: "",
                  }));
                }}
                placeholder="Start typing your street address…"
                className="w-full"
              />
              {addressDisplay ? (
                <p className="mt-2 text-xs text-muted-foreground">Selected: {addressDisplay}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nickname</label>
                <Input
                  value={form.nickname || ""}
                  onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
                  autoComplete="off"
                  placeholder="Optional (e.g., 'Lake House')"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apartment / Unit</label>
                <Input
                  value={form.apartment || ""}
                  onChange={(e) => setForm((p) => ({ ...p, apartment: e.target.value }))}
                  autoComplete="off"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={!canUseAddress || saving} onClick={handleUseThisAddress}>
                Use this address
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1 - basics */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Square feet</label>
                <Input
                  type="number"
                  value={form.squareFeet ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      squareFeet: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lot size (sq ft)</label>
                <Input
                  type="number"
                  value={form.lotSize ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      lotSize: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year built</label>
                <Input
                  type="number"
                  value={form.yearBuilt ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      yearBuilt: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Architectural style</label>
              <Select
                value={form.architecturalStyle || ""}
                onChange={(e) => {
                  const style = e.target.value;
                  setForm((p) => ({ ...p, architecturalStyle: style }));
                }}
                aria-placeholder="Choosing a style helps us suggest sensible rooms and tasks."
              >
                <option value="">Select style</option>
                {STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.hasCentralAir}
                  onChange={(e) => setForm((p) => ({ ...p, hasCentralAir: e.target.checked }))}
                />
                <span>Central air</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.hasBaseboard}
                  onChange={(e) => setForm((p) => ({ ...p, hasBaseboard: e.target.checked }))}
                />
                <span>Baseboard heating</span>
              </label>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={saveBasicsAndNext} disabled={saving}>
                  Save &amp; Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 - review summary */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-md border p-4 text-sm">
              <div className="font-medium mb-2">Summary</div>
              <div className="space-y-1">
                <div>
                  <span className="text-muted-foreground">Address:</span> {addressDisplay}
                </div>
                {form.nickname ? (
                  <div>
                    <span className="text-muted-foreground">Nickname:</span> {form.nickname}
                  </div>
                ) : null}
                {form.architecturalStyle ? (
                  <div>
                    <span className="text-muted-foreground">Style:</span>{" "}
                    {form.architecturalStyle}
                  </div>
                ) : null}
                {form.squareFeet ? (
                  <div>
                    <span className="text-muted-foreground">Sq ft:</span> {form.squareFeet}
                  </div>
                ) : null}
                {form.lotSize ? (
                  <div>
                    <span className="text-muted-foreground">Lot size:</span> {form.lotSize}
                  </div>
                ) : null}
                {form.yearBuilt ? (
                  <div>
                    <span className="text-muted-foreground">Year built:</span>{" "}
                    {form.yearBuilt}
                  </div>
                ) : null}
                <div>
                  <span className="text-muted-foreground">Central air:</span>{" "}
                  {form.hasCentralAir ? "Yes" : "No/unknown"}
                </div>
                <div>
                  <span className="text-muted-foreground">Baseboard:</span>{" "}
                  {form.hasBaseboard ? "Yes" : "No/unknown"}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={finalizeAndNext}>Continue</Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - image upload */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Upload a photo (optional)</label>
              {form.id ? (
                <ImageUpload homeId={form.id} onUploadComplete={handleImageUploaded} disabled={saving} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Create the home first to upload photos.
                </p>
              )}
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="Home"
                  className="mt-3 max-h-48 rounded-md border object-cover"
                />
              ) : null}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={finish}>Finish</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
