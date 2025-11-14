// dwellwell-client/src/components/features/TodayPlanBanner.tsx
import type { TaskPlanResponse } from "@/hooks/useTasksApi";

type Props = {
  hasTasks: boolean;
  planVisible: boolean;
  plan: TaskPlanResponse | null;
  planLoading: boolean;
  planErr: string | null;
  onGeneratePlan: () => void;
  onHide: () => void;
};

export default function TodayPlanBanner({
  hasTasks,
  planVisible,
  plan,
  planLoading,
  planErr,
  onGeneratePlan,
  onHide,
}: Props) {
  // Don’t render if there’s nothing to plan around or user hid it
  if (!hasTasks || !planVisible) return null;

  const buttonLabel = plan ? "Regenerate plan" : "Generate plan";
  const disabled = planLoading || !hasTasks;

  return (
    <section className="mt-1">
      <div className="surface-card flex flex-col gap-3 rounded-xl border border-dashed border-token bg-surface-alt/60 p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Today&apos;s Plan
            </div>
            <p className="mt-1 text-sm text-muted">
              A short, plain-language chore list based on the tasks in your
              current view.
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-muted hover:text-body"
            onClick={onHide}
          >
            Hide
          </button>
        </div>

        {planErr && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/30">
            {planErr}
          </div>
        )}

        {planLoading && (
          <div className="space-y-2">
            <div className="h-3 w-1/2 rounded bg-surface animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-surface animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-surface animate-pulse" />
          </div>
        )}

        {!planLoading && plan && (
          <div className="space-y-2">
            <div className="whitespace-pre-line text-sm">{plan.planText}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
              {typeof plan.estTotalMinutes === "number" &&
                plan.estTotalMinutes > 0 && (
                  <span>Roughly {plan.estTotalMinutes} minutes of work.</span>
                )}
              {plan.tagline && (
                <span className="italic">“{plan.tagline}”</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGeneratePlan}
            disabled={disabled}
            className={[
              "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-60",
              // Ghost / secondary style
              "border-primary/40 bg-transparent text-[rgb(var(--primary))] hover:bg-primary/5",
            ].join(" ")}
          >
            {buttonLabel}
          </button>
          <span className="text-[11px] text-muted">
            Uses only the tasks currently visible in your timeframe.
          </span>
        </div>
      </div>
    </section>
  );
}
