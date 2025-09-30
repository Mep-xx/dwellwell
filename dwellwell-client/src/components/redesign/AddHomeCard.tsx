// dwellwell-client/src/components/redesign/AddHomeCard.tsx
import { Plus } from "lucide-react";

type Props = {
  className?: string;
  onClick?: () => void; // open the AddHomeWizard from the page
};

export default function AddHomeCard({ className = "", onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`group h-44 w-full rounded-2xl border border-dashed border-token hover:border-brand-primary 
                  text-muted-foreground hover:text-brand-primary grid place-items-center transition bg-card ${className}`}
      title="Add a new home"
    >
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">Add Home</span>
      </div>
    </button>
  );
}
