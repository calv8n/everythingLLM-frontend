import { useState } from "react";
import type { ConversationMessage, Phase, TaskResult } from "../types/events";
import ConversationThread from "./ConversationThread";
import StatusIndicator, { type Stage } from "./StatusIndicator";
import PlanningPanel from "./PlanningPanel";
import CodePanel from "./CodePanel";
import LogPanel from "./LogPanel";
import ResultPanel from "./ResultPanel";
import ErrorDisplay from "./ErrorDisplay";

interface Props {
  phase: Phase;
  planningText: string;
  code: string;
  logs: string[];
  result: TaskResult | null;
  error: string | null;
  conversation: ConversationMessage[];
  onFollowUp: (prompt: string) => void;
  onNewTask: () => void;
}

export default function ExecutionView({
  phase,
  planningText,
  code,
  logs,
  result,
  error,
  conversation,
  onFollowUp,
  onNewTask,
}: Props) {
  const [followUpPrompt, setFollowUpPrompt] = useState("");
  const initialStage: Stage = phase === "idle" || phase === "error" ? "planning" : phase;
  const [activeStage, setActiveStage] = useState<Stage>(initialStage);
  const [previousPhase, setPreviousPhase] = useState(phase);

  if (phase !== previousPhase) {
    setPreviousPhase(phase);
    if (phase !== "idle" && phase !== "error") {
      setActiveStage(phase);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          New Task
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-300">EverythingLLM</span>
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 space-y-6">
        <ConversationThread messages={conversation} phase={phase} />

        {/* Status */}
        <StatusIndicator
          currentPhase={phase}
          activeStage={activeStage}
          onSelectStage={setActiveStage}
        />

        <div
          id="task-stage-panel"
          role="tabpanel"
          aria-label={`${activeStage} stage`}
          className="mt-8 min-h-80"
        >
          {error && (
            <div className="mb-4">
              <ErrorDisplay message={error} onRetry={onNewTask} />
            </div>
          )}

          {activeStage === "planning" && (
            <PlanningPanel text={planningText} isActive={phase === "planning"} />
          )}

          {activeStage === "code" &&
            (code ? (
              <CodePanel code={code} />
            ) : (
              <StagePlaceholder
                title="Generated code will appear here"
                isActive={phase === "planning" || phase === "code"}
              />
            ))}

          {activeStage === "executing" && (
            <LogPanel logs={logs} isActive={phase === "executing"} />
          )}

          {activeStage === "result" &&
            (result ? (
              <div className="space-y-5">
                <ResultPanel result={result} />
                <form
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const prompt = followUpPrompt.trim();
                    if (!prompt || phase !== "result") return;
                    onFollowUp(prompt);
                    setFollowUpPrompt("");
                  }}
                >
                  <label
                    htmlFor="follow-up-prompt"
                    className="mb-2 block text-sm font-medium text-gray-200"
                  >
                    Request a change or give feedback
                  </label>
                  <textarea
                    id="follow-up-prompt"
                    value={followUpPrompt}
                    onChange={(event) => setFollowUpPrompt(event.target.value)}
                    placeholder="For example: add a totals row and sort the table descending"
                    rows={3}
                    disabled={phase !== "result"}
                    className="w-full resize-y rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-blue-500 disabled:opacity-60"
                  />
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      Recent session context is kept for up to 6 messages.
                    </p>
                    <button
                      type="submit"
                      disabled={!followUpPrompt.trim() || phase !== "result"}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Run revision
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <StagePlaceholder
                title="The result will appear here when execution finishes"
                isActive={phase !== "error"}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function StagePlaceholder({
  title,
  isActive,
}: {
  title: string;
  isActive: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
      {isActive && (
        <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
      )}
      {title}
    </div>
  );
}