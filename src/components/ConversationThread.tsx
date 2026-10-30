import { useEffect, useRef, useState } from "react";
import type { ConversationMessage, Phase } from "../types/events";
import StatusIndicator, { type Stage } from "./StatusIndicator";
import PlanningPanel from "./PlanningPanel";
import CodePanel from "./CodePanel";
import LogPanel from "./LogPanel";
import ResultPanel from "./ResultPanel";

interface Props {
  messages: ConversationMessage[];
  phase: Phase;
}

export default function ConversationThread({ messages, phase }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="chat-messages" aria-label="Chat conversation" aria-live="polite">
      {messages.map((message, index) => (
        <ChatMessage
          key={`${index}-${message.role}`}
          message={message}
          phase={phase}
          isLatest={index === messages.length - 1}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatMessage({
  message,
  phase,
  isLatest,
}: {
  message: ConversationMessage;
  phase: Phase;
  isLatest: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <article className="chat-message chat-user-message">
        <div className="chat-user-bubble">
          <p className="chat-role-label">You</p>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <RoleAvatar role="user" />
      </article>
    );
  }

  return (
    <article className="chat-message chat-agent-message">
      <RoleAvatar role="agent" />
      <div className="chat-agent-content">
        <p className="chat-role-label">EverythingLLM</p>
        <AgentWorkflow message={message} phase={phase} isLatest={isLatest} />
      </div>
    </article>
  );
}

function AgentWorkflow({
  message,
  phase,
  isLatest,
}: {
  message: ConversationMessage;
  phase: Phase;
  isLatest: boolean;
}) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const stage = message.stage ?? "planning";
  const activeStage = selectedStage ?? stage;
  const workflowPhase = isLatest ? phase : stage;

  return (
    <section className="chat-workflow" aria-label="Agent task workflow">
      <p className="chat-workflow-heading">Task steps</p>
      <StatusIndicator
        currentPhase={workflowPhase}
        activeStage={activeStage}
        onSelectStage={setSelectedStage}
      />
      <div className="chat-workflow-panel" role="tabpanel" aria-label={`${activeStage} stage`}>
        {activeStage === "planning" && (
          <PlanningPanel
            text={message.planningText ?? ""}
            isActive={isLatest && phase === "planning"}
          />
        )}
        {activeStage === "code" && (
          message.code ? (
            <CodePanel code={message.code} />
          ) : (
            <WorkflowPlaceholder>Generated code will appear here.</WorkflowPlaceholder>
          )
        )}
        {activeStage === "executing" && (
          <LogPanel
            logs={message.logs ?? []}
            isActive={isLatest && phase === "executing"}
          />
        )}
        {activeStage === "result" && (
          message.error ? (
            <div className="chat-workflow-error">{message.error}</div>
          ) : message.result ? (
            <ResultPanel result={message.result} />
          ) : (
            <WorkflowPlaceholder>
              {isLatest && phase !== "error"
                ? "The result will appear here when the task finishes."
                : "No result was returned."}
            </WorkflowPlaceholder>
          )
        )}
      </div>
    </section>
  );
}

function WorkflowPlaceholder({ children }: { children: string }) {
  return <p className="chat-workflow-placeholder">{children}</p>;
}

function RoleAvatar({ role }: { role: "user" | "agent" }) {
  return (
    <span
      aria-hidden="true"
      className={`chat-avatar ${
        role === "user"
          ? "chat-avatar-user"
          : "chat-avatar-agent"
      }`}
    >
      {role === "user" ? "U" : "✦"}
    </span>
  );
}
