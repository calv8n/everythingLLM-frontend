import { useState } from "react";
import MarkdownContent from "./MarkdownContent";
 
interface Props {
  text: string;
  isActive: boolean;
}
 
export default function PlanningPanel({ text, isActive }: Props) {
  const [collapsed, setCollapsed] = useState(false);
 
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-300">
            Planning & Analysis
          </span>
          {isActive && (
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
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
        <div className="px-4 pb-4 max-h-80 overflow-y-auto">
          <div className="text-sm">
            {text ? (
              <MarkdownContent content={text} />
            ) : (
              <p className="py-2 text-sm text-gray-500">
                {isActive ? "Waiting for the model's analysis…" : "No analysis was returned."}
              </p>
            )}
            {isActive && (
              <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}