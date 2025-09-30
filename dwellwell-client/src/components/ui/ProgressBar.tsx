//dwellwell-client/src/components/ui/progressbar.tsx
interface ProgressBarProps {
  currentStep: number; // zero-based
  steps: string[];
}

export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
  const clamped = Math.min(Math.max(currentStep, 0), Math.max(steps.length - 1, 0));
  const widthPct = steps.length > 1 ? (clamped / (steps.length - 1)) * 100 : 0;

  return (
    <div className="relative flex w-full items-center justify-between px-4" aria-label="Progress">
      {/* Track */}
      <div className="absolute left-0 right-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-muted" />

      {/* Fill */}
      <div
        className="absolute left-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-brand-primary transition-all duration-300"
        style={{ width: `${widthPct}%` }}
      />

      {/* Steps */}
      {steps.map((_, index) => {
        const isCurrent = index === clamped;
        const isComplete = index < clamped;

        return (
          <div key={index} className="relative z-10 flex flex-1 flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-300 ${
                isCurrent
                  ? "border-brand-primary bg-brand-primary text-white"
                  : isComplete
                  ? "border-brand-primary bg-card text-brand-primary"
                  : "border-token bg-card text-muted-foreground"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {index + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
