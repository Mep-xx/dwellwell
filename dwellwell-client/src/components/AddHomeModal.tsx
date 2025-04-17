// src/components/AddHomeModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function AddHomeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [address, setAddress] = useState('');

  const handleSubmit = async () => {
    if (!address) return;

    try {
      const res = await fetch('/api/ai/enrich-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const enriched = await res.json();
      console.log('🏠 Enriched home data:', enriched);
      // TODO: Save to backend
      onClose();
    } catch (err) {
      console.error('Failed to enrich home:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New Home</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter your home address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
