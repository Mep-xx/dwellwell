interface ProgressBarProps {
  currentStep: number;
  steps: string[];
}

export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
  return (
    <div className="w-full flex items-center justify-between relative px-4">
      {/* Full progress line behind the steps */}
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 transform -translate-y-1/2 z-0" />

      {/* Filled portion of the bar */}
      <div
        className="absolute left-0 top-1/2 h-0.5 bg-brand-primary transform -translate-y-1/2 z-0 transition-all duration-300"
        style={{
          width: `${(currentStep / (steps.length - 1)) * 100}%`,
        }}
      />

      {/* Step Circles */}
      {steps.map((_, index) => {
        const isCurrent = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <div key={index} className="relative z-10 flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                isCurrent
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : isComplete
                  ? 'bg-white text-brand-primary border-brand-primary'
                  : 'bg-white text-gray-400 border-gray-300'
              }`}
            >
              {index + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
