// /dwellwell-client/src/components/DeleteHomeModal.tsx
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
      <DialogContent className="max-w-md p-6 space-y-6 bg-card text-body border border-token">
        <div className="flex flex-col items-center text-center">
          <img
            src="/images/house_fadeout_placeholder.png"
            alt="Disappearing Home"
            className="w-24 h-24 mb-4 opacity-60"
          />
          <DialogTitle className="text-danger text-2xl font-bold">Delete This Home?</DialogTitle>
          <DialogDescription className="text-muted pt-2">
            Deleting this home will permanently remove all related Rooms, Trackables, Lawn Profiles, Vehicles, and Tasks.
            <br /><br />
            <strong className="text-body">This action cannot be undone.</strong> Are you sure you want to continue?
          </DialogDescription>
        </div>

        <div className="flex justify-end gap-4 pt-6">
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
