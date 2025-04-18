// src/components/AddHomeModal.tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { api } from '@/utils/api';

export function AddHomeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!address.trim()) return;

    try {
      setLoading(true);

      console.log('🔍 Enriching address:', address);

      // ✅ Fixed route: now correctly matches /api/homes/ai/enrich-home
      const enrichRes = await api.post('/api/homes/enrich-home', { address });
      const enriched = enrichRes.data;
      console.log('🏠 Enriched home data:', enriched);

      onClose();
    } catch (err) {
      console.error('❌ Failed to enrich/save home:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4">
        <div className="flex flex-col space-y-1 mb-4">
          <DialogTitle className="text-xl font-semibold">
            Add a New Home
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Enter your home’s address. We’ll try to fetch details automatically.
          </DialogDescription>
        </div>

        <Input
          placeholder="123 Main St, Springfield, IL"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'Submit'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
