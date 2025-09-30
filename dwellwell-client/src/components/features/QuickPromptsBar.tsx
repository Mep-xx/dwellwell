//dwellwell-client/src/components/features/QuickPromptsBar.tsx
import * as React from "react";
import { useQuickPrompts } from "@/hooks/useQuickPrompts";
import { apiQuick } from "@/utils/apiQuick";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, HelpCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  homeId: string;
  rooms: Array<{ id: string; name?: string | null; type?: string | null }>;
  trackables: Array<{ id: string; roomId?: string | null; kind?: string | null }>;
  onCreated?: (trackableId: string) => void;
  className?: string;
};

export default function QuickPromptsBar({ homeId, rooms, trackables, onCreated, className }: Props) {
  const { nextPrompts, dismiss } = useQuickPrompts({ homeId, rooms, trackables });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const visible = nextPrompts.slice(0, 3);

  if (visible.length === 0) return null;

  const handleYes = async (roomId: string, pid: string, kind: string, category?: string) => {
    setBusyId(pid);
    try {
      const { data } = await apiQuick.trackables.quickCreate({
        roomId, kind, category: category ?? null, userDefinedName: null,
      });
      onCreated?.(data.id);
    } finally {
      setBusyId(null);
      dismiss(pid);
    }
  };

  return (
    <Card className={cn("p-3 md:p-4 border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/20", className)}>
      <div className="flex items-start gap-3">
        <Plus className="mt-1 h-5 w-5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium">Quick add common items</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ room, prompt }) => (
              <div key={prompt.id} className="flex items-center justify-between rounded-lg border p-2 bg-card/70 dark:bg-zinc-900/40">
                <div className="mr-2 text-sm">
                  <div className="font-medium">{room.name || (room.type || "Room")}</div>
                  <div className="text-xs text-muted-foreground">{prompt.label}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" disabled={busyId === prompt.id}
                          onClick={() => handleYes(room.id, prompt.id, prompt.kind, prompt.category)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Yes
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => dismiss(prompt.id)}>
                    <HelpCircle className="h-4 w-4 mr-1" /> Not sure
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dismiss(prompt.id)}>
                    <XCircle className="h-4 w-4 mr-1" /> No
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Add now, refine details later. We’ll create routine tasks automatically.
          </div>
        </div>
      </div>
    </Card>
  );
}
