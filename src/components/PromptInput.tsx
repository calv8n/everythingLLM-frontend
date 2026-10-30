import { useState } from "react";
 
const EXAMPLES = [
  "Print the first 20 Fibonacci numbers",
  "Scrape the top 5 Hacker News stories and summarize them",
  "Generate a bar chart comparing populations of the top 10 countries",
  "Find the factorial of numbers 1 through 15 and display as a table",
];
 
interface Props {
  onSubmit: (prompt: string, groqApiKey?: string) => void;
  provider: string;
}
 
export default function PromptInput({ onSubmit, provider }: Props) {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
 
  const isGroq = provider === "groq";
 
  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (isGroq && !apiKey.trim()) return;
    onSubmit(trimmed, isGroq ? apiKey.trim() : undefined);
  };
 
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <h1 className="text-3xl font-bold text-white">EverythingLLM</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Describe a task and I'll write code to accomplish it
          </p>
        </div>
 
        {/* Groq API Key Input */}
        {isGroq && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Groq API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-gray-900 text-gray-100 placeholder-gray-500 px-4 py-3 rounded-xl border border-gray-800 outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-xs text-gray-600 mt-1">
              Your key is sent per-request and never stored on the server.
            </p>
          </div>
        )}
 
        {/* Input */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-1 shadow-2xl">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like me to do?"
            rows={4}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 p-4 resize-none outline-none text-lg"
          />
          <div className="flex justify-end p-2 pt-0">
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || (isGroq && !apiKey.trim())}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              Run Task
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
 
        {/* Example prompts */}
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="px-3 py-1.5 text-sm text-gray-400 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 hover:text-gray-300 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}