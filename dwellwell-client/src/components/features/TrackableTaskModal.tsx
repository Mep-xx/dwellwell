//dwellwell-client/src/components/TrackableTaskModal.tsx
import { useMemo, useState } from "react";
import { Task } from "@shared/types/task";
import { X, ChevronDown, ChevronUp } from "lucide-react";

type ResourceLink = { label?: string; url?: string };
type MaybeTemplate = {
  description?: string | null;
  recurrenceInterval?: string | null;
  criticality?: "low" | "medium" | "high";
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: ResourceLink[];
};

type RichTask = Task & {
  template?: MaybeTemplate;
  // Some APIs stick template-like fields directly on task:
  description?: string | null;
  recurrenceInterval?: string | null;
  criticality?: "low" | "medium" | "high";
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: ResourceLink[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tasks: RichTask[];
  trackableName: string;
};

export default function TrackableTaskModal({ isOpen, onClose, tasks, trackableName }: Props) {
  // hooks must be unconditional for stable order
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const items = useMemo(() => tasks ?? [], [tasks]);

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card text-body rounded-xl w-full max-w-3xl p-6 shadow-lg relative max-h-[85vh] overflow-y-auto border border-token">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted hover:text-body" aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-semibold mb-1">Tasks for: {trackableName}</h2>
        <p className="text-xs text-muted mb-4">{items.length} task{items.length === 1 ? "" : "s"}</p>

        {items.length === 0 ? (
          <p className="text-muted">No tasks found for this item.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((t) => {
              const id = t.id;
              const tpl: MaybeTemplate = {
                description: t.description ?? t.template?.description,
                recurrenceInterval: t.recurrenceInterval ?? t.template?.recurrenceInterval,
                criticality: (t as any).criticality ?? t.template?.criticality,
                steps: t.steps ?? t.template?.steps,
                equipmentNeeded: t.equipmentNeeded ?? t.template?.equipmentNeeded,
                resources: t.resources ?? t.template?.resources,
              };

              const statusBadge =
                t.status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100"
                  : t.status === "SKIPPED"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                  : "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100";

              const critBadge =
                tpl.criticality === "high"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100"
                  : tpl.criticality === "medium"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-100";

              const hasDetails =
                !!(tpl.description || tpl.steps?.length || tpl.equipmentNeeded?.length || tpl.resources?.length);

              return (
                <li key={id} className="border border-token rounded-lg p-4 bg-surface-alt shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{t.title}</h3>
                        {tpl.criticality && (
                          <span className={`text-xs px-2 py-0.5 rounded ${critBadge}`}>
                            {tpl.criticality} criticality
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
                        {t.dueDate && (
                          <span>
                            <span className="uppercase text-[11px] mr-1">Due:</span>
                            <strong className="text-body">{formatDate(t.dueDate)}</strong>
                          </span>
                        )}
                        {tpl.recurrenceInterval && (
                          <span>
                            <span className="uppercase text-[11px] mr-1">Recurs:</span>
                            <strong className="text-body">{tpl.recurrenceInterval}</strong>
                          </span>
                        )}
                        <span>
                          <span className="uppercase text-[11px] mr-1">Status:</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${statusBadge}`}>{t.status}</span>
                        </span>
                      </div>
                    </div>

                    {hasDetails && (
                      <button
                        onClick={() => toggle(id)}
                        className="text-sm px-2 py-1 border border-token rounded hover:bg-card inline-flex items-center gap-1"
                      >
                        {expanded[id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {expanded[id] ? "Hide details" : "Show details"}
                      </button>
                    )}
                  </div>

                  {tpl.description && !expanded[id] && (
                    <p className="text-sm text-muted mt-2 line-clamp-2">{tpl.description}</p>
                  )}

                  {expanded[id] && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <DetailBlock title="Description">
                        {tpl.description ? <p className="text-sm">{tpl.description}</p> : <Empty />}
                      </DetailBlock>

                      <DetailBlock title="Steps">
                        {tpl.steps?.length ? (
                          <ul className="list-decimal pl-5 space-y-1 text-sm">
                            {tpl.steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        ) : (
                          <Empty />
                        )}
                      </DetailBlock>

                      <DetailBlock title="Equipment">
                        {tpl.equipmentNeeded?.length ? (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {tpl.equipmentNeeded.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        ) : (
                          <Empty />
                        )}
                      </DetailBlock>

                      <DetailBlock title="Resources" full>
                        {tpl.resources?.length ? (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {tpl.resources.map((r, i) =>
                              r?.url ? (
                                <li key={i}>
                                  <a className="underline" href={r.url} target="_blank" rel="noreferrer">
                                    {r.label || r.url}
                                  </a>
                                </li>
                              ) : (
                                <li key={i}>{r?.label}</li>
                              )
                            )}
                          </ul>
                        ) : (
                          <Empty />
                        )}
                      </DetailBlock>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DetailBlock({
  title,
  children,
  full = false,
}: {
  title: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-3" : ""}>
      <div className="text-[11px] uppercase text-muted mb-1">{title}</div>
      <div className="border border-token rounded p-2 bg-card">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-xs text-muted">No details.</div>;
}

function formatDate(s: string | Date) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleString();
}
