//dwellwell-client/src/components/features/TaskBuckets.tsx
import TaskCard from "@/components/features/TaskCard";
import type { TaskListItem } from "@/hooks/useTasksApi";

export type Buckets = {
  overdue: TaskListItem[];
  week: TaskListItem[];
  month: TaskListItem[];
  later: TaskListItem[];
};

export default function TaskBuckets({
  buckets,
  onOpenDrawer,
}: {
  buckets: Buckets;
  onOpenDrawer?: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {renderSection("Overdue", buckets.overdue, onOpenDrawer)}
      {renderSection("This Week", buckets.week, onOpenDrawer)}
      {renderSection("This Month", buckets.month, onOpenDrawer)}
      {renderSection("Later", buckets.later, onOpenDrawer)}
    </div>
  );
}

function renderSection(
  title: string,
  items: TaskListItem[],
  onOpenDrawer?: (id: string) => void
) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold text-body">{title}</h3>
        <span className="text-xs text-muted"> {items.length} </span>
      </div>
      {items.length === 0 ? (
        <div className="surface-card p-4 text-sm text-muted rounded-lg border">Nothing here</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {items.map((t) => (
            <TaskCard key={t.id} t={t} onOpenDrawer={onOpenDrawer} />
          ))}
        </div>
      )}
    </section>
  );
}
