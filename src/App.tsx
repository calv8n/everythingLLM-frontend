import { useEffect, useState } from "react";
import { useTaskExecution } from "./hooks/useTaskExecution";
import type { LLMProvider } from "./lib/api";
import ChatComposer from "./components/ChatComposer";
import ConversationThread from "./components/ConversationThread";

type Theme = "dark" | "light";

function readSavedTheme(): Theme {
  try {
    return localStorage.getItem("task-runner-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default function App() {
  const showOllama = !import.meta.env.PROD;
  const [provider, setProvider] = useState<LLMProvider>(
    () => showOllama ? "ollama" : "groq",
  );
  const [theme, setTheme] = useState<Theme>(readSavedTheme);
  const { phase, conversation, submitTask, submitFollowUp, reset } = useTaskExecution();
  const isEmpty = conversation.length === 0;
  const isBusy = phase === "planning" || phase === "code" || phase === "executing";

  useEffect(() => {
    try {
      localStorage.setItem("task-runner-theme", theme);
    } catch {
      // Theme still works for this page session when storage is unavailable.
    }
  }, [theme]);

  const sendMessage = (
    prompt: string,
    selectedProvider: LLMProvider,
    groqApiKey?: string,
    groqModel?: string,
  ) => {
    if (phase === "idle") {
      submitTask(prompt, selectedProvider, groqApiKey, groqModel);
    } else {
      submitFollowUp(prompt, selectedProvider, groqApiKey, groqModel);
    }
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">✦</span>
          <span>EverythingLLM</span>
          <span className="brand-chevron">⌄</span>
        </div>

        <button className="sidebar-new-chat" type="button" onClick={reset}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
          <span className="new-chat-shortcut">⌘ K</span>
        </button>

        <div className="sidebar-section-label">WORKSPACE</div>
        <div className="sidebar-workspace-item">
          <span className="workspace-icon">⌘</span>
          <span className="workspace-copy">
            <strong>Code assistant</strong>
            <small>Plan · research · build</small>
          </span>
          <span className="workspace-status" aria-label="Ready" />
        </div>

        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <div className="provider-card">
            <span className="provider-indicator" />
            <div>
              <strong>{provider === "groq" ? "Groq model" : "Local Ollama"}</strong>
              <small>{provider === "groq" ? "Cloud provider" : "Private · local"}</small>
            </div>
          </div>
          <p>Generated code runs in an isolated Docker container.</p>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-topbar">
          <div className="chat-title-wrap">
            <span className="mobile-brand-mark">✦</span>
            <span className="chat-title">{isEmpty ? "New chat" : "Task conversation"}</span>
            {!isEmpty && <span className="session-pill">Active session</span>}
          </div>
          <div className="topbar-actions">
            <span className="model-pill">
              <span className="provider-indicator" />
              {provider === "groq" ? "Groq" : "Ollama"}
            </span>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className={`chat-scroll-area ${isEmpty ? "chat-empty" : ""}`}>
          {isEmpty ? (
            <section className="welcome-panel">
              <div className="welcome-icon">✦</div>
              <h1>What should we build?</h1>
              <p>Tell me what you need. I’ll plan it, research when needed, and write and run the code.</p>
            </section>
          ) : (
            <div className="conversation-column">
              <ConversationThread messages={conversation} phase={phase} />
            </div>
          )}
        </div>

        <footer className="chat-footer">
          <div className="composer-column">
            <ChatComposer
              provider={provider}
              onProviderChange={setProvider}
              showOllama={showOllama}
              disabled={isBusy}
              isEmpty={isEmpty}
              onSubmit={sendMessage}
            />
          </div>
        </footer>
      </main>
    </div>
  );
}