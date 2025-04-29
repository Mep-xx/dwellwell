import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DeleteHomeModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteHomeModal({ isOpen, onConfirm, onCancel }: DeleteHomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogTitle className="text-red-600 text-2xl font-bold">Delete This Home?</DialogTitle>
        <DialogDescription className="text-gray-700">
          Deleting this home will permanently remove all related Rooms, Trackables, Lawn Profiles, Vehicles, and Tasks.
          <br /><br />
          This action cannot be undone. Are you sure you want to continue?
        </DialogDescription>
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Yes, Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
