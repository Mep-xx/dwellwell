import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Home } from '@shared/types/home';
import { useState, useEffect } from 'react';

type EditHomeModalProps = {
  isOpen: boolean;
  home: Home | null;
  onSave: (updatedHome: Partial<Home>) => void;
  onCancel: () => void;
};

export function EditHomeModal({ isOpen, home, onSave, onCancel }: EditHomeModalProps) {
  const [nickname, setNickname] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');

  useEffect(() => {
    if (home) {
      setNickname(home.nickname || '');
      setSquareFeet(home.squareFeet?.toString() || '');
      setLotSize(home.lotSize?.toString() || '');
      setYearBuilt(home.yearBuilt?.toString() || '');
    }
  }, [home]);

  const handleSave = () => {
    if (!home) return;

    onSave({
      id: home.id,
      nickname: nickname || null,
      squareFeet: squareFeet ? parseInt(squareFeet) : null,
      lotSize: lotSize ? parseFloat(lotSize) : null,
      yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="space-y-4 max-w-md">
        <DialogTitle className="text-2xl font-bold text-brand-primary">Edit Home Details</DialogTitle>
        <DialogDescription className="text-gray-600">
          Update your home's nickname, square footage, lot size, and year built.
        </DialogDescription>

        <div className="space-y-2">
          <Input
            placeholder="Nickname (optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Input
            placeholder="Square Feet"
            type="number"
            value={squareFeet}
            onChange={(e) => setSquareFeet(e.target.value)}
          />
          <Input
            placeholder="Lot Size (acres)"
            type="number"
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
          />
          <Input
            placeholder="Year Built"
            type="number"
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
