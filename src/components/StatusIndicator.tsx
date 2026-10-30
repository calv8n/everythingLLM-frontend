import type { Phase } from "../types/events";

export type Stage = Exclude<Phase, "idle" | "error">;

const STEPS: { key: Stage; label: string }[] = [
  { key: "planning", label: "Planning" },
  { key: "code", label: "Code" },
  { key: "executing", label: "Executing" },
  { key: "result", label: "Result" },
];
 
interface Props {
  currentPhase: Phase;
  activeStage: Stage;
  onSelectStage: (stage: Stage) => void;
}

export default function StatusIndicator({
  currentPhase,
  activeStage,
  onSelectStage,
}: Props) {
  const isError = currentPhase === "error";
  const stepIndex = STEPS.findIndex((s) => s.key === currentPhase);

  return (
    <div
      className="flex items-center gap-1 w-full max-w-lg mx-auto"
      role="tablist"
      aria-label="Task stages"
    >
      {STEPS.map((step, i) => {
        const isSelected = step.key === activeStage;
        const isCompleted = !isError && stepIndex > i;
        const isFailed = isError && step.key === activeStage;
 
        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Step dot + label */}
            <button
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls="task-stage-panel"
              onClick={() => onSelectStage(step.key)}
              className="flex flex-col items-center gap-1 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isFailed
                    ? "bg-red-500/20 text-red-400 ring-4 ring-red-500/10"
                    : isSelected
                    ? "bg-blue-500 text-white ring-4 ring-blue-500/20 animate-pulse-slow"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isFailed
                    ? "text-red-400"
                    : isSelected
                    ? "text-blue-400"
                    : isCompleted
                    ? "text-green-400"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </button>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 mb-5 transition-colors duration-300 ${
                  isCompleted ? "bg-green-500" : "bg-gray-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}