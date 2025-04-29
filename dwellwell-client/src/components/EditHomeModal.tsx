// /dwellwell-client/src/components/EditHomeModal.tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useState } from 'react';
import { Home } from '@shared/types/home';

type Props = {
  isOpen: boolean;
  home: Home;
  onClose: () => void;
  onSave: (updated: Partial<Home>) => void;
};

export function EditHomeModal({ isOpen, onClose, home, onSave }: Props) {
  const [nickname, setNickname] = useState(home.nickname ?? '');
  const [squareFeet, setSquareFeet] = useState(home.squareFeet?.toString() ?? '');
  const [lotSize, setLotSize] = useState(home.lotSize?.toString() ?? '');
  const [yearBuilt, setYearBuilt] = useState(home.yearBuilt?.toString() ?? '');
  const [imageUrl, setImageUrl] = useState(home.imageUrl ?? '');

  const handleSave = () => {
    onSave({
      nickname,
      squareFeet: squareFeet ? Number(squareFeet) : null,
      lotSize: lotSize ? Number(lotSize) : null,
      yearBuilt: yearBuilt ? Number(yearBuilt) : null,
      imageUrl,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4 max-w-md">
        <div className="flex flex-col space-y-1">
          <DialogTitle className="text-2xl font-bold text-brand-primary">Edit Home</DialogTitle>
          <DialogDescription>Edit home details below.</DialogDescription>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Nickname"
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

          <div>
            <label className="block text-sm mb-2 font-medium text-gray-700">Home Image</label>
            {imageUrl && (
              <div className="mb-3">
                <img src={imageUrl} alt="Current Home" className="rounded w-full max-h-40 object-cover" />
              </div>
            )}
            <ImageUpload onUploadComplete={(url) => setImageUrl(url)} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
