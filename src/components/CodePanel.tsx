import { useState } from "react";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"


interface Props {
    code: string;
}

export default function CodePanel({ code }: Props) {
    const [collapsed, setCollapsed] = useState(false);

    if (!code) return null;

    return (
        <div className="bg-gray-900 border-gray-800 rounded-xl overflow-hidden">
            <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg
                    className="w-4 h-4 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 20l4-16m4 4l4 4-4 4M6 12l-4-4 4-4"
                        />
                    </svg>
                    <span className="text-sm font-medium text-gray-300">
                        Generated Code
                    </span>
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
                <div className="max-h-96 overflow-y-auto">
                    <SyntaxHighlighter
                    language="python"
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        background: "transparent",
                        fontSize: "0.8125rem",
                        padding: "0 1rem 1 rem",
                    }}
                    showInlineLineNumbers
                    >
                        {code}
                    </SyntaxHighlighter>
                </div>
            )}
        </div>
    );
}