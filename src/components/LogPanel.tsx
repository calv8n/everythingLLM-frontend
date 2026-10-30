import { useState, useEffect, useRef } from "react";
 
interface Props {
  logs: string[];
  isActive: boolean;
}
 
export default function LogPanel({ logs, isActive }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    if (!collapsed && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, collapsed]);
 
  if (logs.length === 0 && !isActive) return null;
 
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-300">
            Execution Logs
          </span>
          {isActive && (
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            collapsed ? "" : "rotate-180"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 max-h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 && isActive && (
            <div className="text-gray-500 flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Waiting for output...
            </div>
          )}
          {logs.map((line, i) => (
            <div
              key={i}
              className="text-gray-300 py-0.5 border-b border-gray-800/50 last:border-0"
            >
              <span className="text-gray-600 select-none mr-2">$</span>
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}