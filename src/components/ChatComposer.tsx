import { useRef, useState } from "react";
import type { LLMProvider } from "../lib/api";

const EXAMPLES = [
  "Print the first 20 Fibonacci numbers",
  "Create a CSV table of the first 15 prime numbers",
  "Make a chart comparing the top 10 countries by population",
];

type SearchProvider = "duckduckgo" | "searxng" | "tavily";

interface Props {
  provider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
  showOllama: boolean;
  disabled: boolean;
  isEmpty: boolean;
  onSubmit: (
    prompt: string,
    provider: LLMProvider,
    groqApiKey?: string,
    groqModel?: string,
    webSearch?: boolean,
    searchProvider?: string,
  ) => void;
}

const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

export default function ChatComposer({
  provider,
  onProviderChange,
  showOllama,
  disabled,
  isEmpty,
  onSubmit,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [groqModel, setGroqModel] = useState(DEFAULT_GROQ_MODEL);
  const [webSearch, setWebSearch] = useState(false);
  const [searchProvider, setSearchProvider] = useState<SearchProvider>("duckduckgo");
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const isGroq = provider === "groq";
  const groqInputsComplete = Boolean(groqApiKey.trim() && groqModel.trim());
  const canSend = prompt.trim().length > 0 && !disabled &&
    (!isGroq || groqInputsComplete);

  const submit = () => {
    if (!canSend) return;
    if (isGroq && (!apiKeyInputRef.current?.isConnected || !modelInputRef.current?.isConnected)) {
      return;
    }
    onSubmit(
      prompt.trim(),
      provider,
      isGroq ? groqApiKey.trim() : undefined,
      isGroq ? groqModel.trim() : undefined,
      webSearch,
      webSearch ? searchProvider : undefined,
    );
    setPrompt("");
  };

  return (
    <div className="chat-composer-wrap">
      <div
        className="provider-selector"
        role={showOllama ? "group" : undefined}
        aria-label="Choose language model provider"
      >
        {showOllama ? (
          <>
            <button
              type="button"
              aria-pressed={provider === "ollama"}
              disabled={disabled}
              onClick={() => onProviderChange("ollama")}
            >
              Ollama · local
            </button>
            <button
              type="button"
              aria-pressed={provider === "groq"}
              disabled={disabled}
              onClick={() => onProviderChange("groq")}
            >
              Groq · API
            </button>
          </>
        ) : (
          <span className="provider-selector-current">Groq · API</span>
        )}
      </div>
      {isEmpty && (
        <div className="chat-suggestions" aria-label="Suggested prompts">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="chat-suggestion"
            >
              {example}
            </button>
          ))}
        </div>
      )}
      {isGroq && (
        <div className="groq-credentials" aria-label="Groq model settings">
          <label className="chat-api-key">
            <span>Groq API key</span>
            <input
              ref={apiKeyInputRef}
              type="password"
              value={groqApiKey}
              onChange={(event) => setGroqApiKey(event.target.value)}
              placeholder="gsk_…"
              autoComplete="off"
              required
              aria-required="true"
            />
          </label>
          <label className="chat-api-key">
            <span>Groq model</span>
            <input
              ref={modelInputRef}
              type="text"
              value={groqModel}
              onChange={(event) => setGroqModel(event.target.value)}
              placeholder="openai/gpt-oss-120b"
              autoComplete="off"
              required
              aria-required="true"
            />
          </label>
        </div>
      )}
      <div className="research-controls" aria-label="Web-search settings">
        <label className="research-toggle">
          <input
            type="checkbox"
            checked={webSearch}
            onChange={(event) => setWebSearch(event.target.checked)}
            aria-label="Enable web search"
          />
          <span>Web search</span>
        </label>
        {webSearch && (
          <label className="research-provider">
            <span>Provider</span>
            <select
              value={searchProvider}
              onChange={(event) => setSearchProvider(event.target.value as SearchProvider)}
              aria-label="Search provider"
            >
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="searxng">SearXNG</option>
              <option value="tavily">Tavily</option>
            </select>
          </label>
        )}
      </div>
      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={disabled ? "The agent is working…" : "Message EverythingLLM"}
          aria-label="Message EverythingLLM"
          rows={1}
          disabled={disabled}
        />
        <div className="chat-composer-actions">
          <span className="chat-composer-hint">
            {disabled ? "Working on your task" : "Enter to send · Shift + Enter for a new line"}
          </span>
          <button type="submit" disabled={!canSend} aria-label="Send message">
            {disabled ? (
              <span className="chat-send-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12 20 4l-5 16-3-7-8-1Zm8 1 8-9" />
              </svg>
            )}
          </button>
        </div>
      </form>
      <p className="chat-disclaimer">
        EverythingLLM can make mistakes. Review generated code and results before relying on them.
      </p>
    </div>
  );
}
