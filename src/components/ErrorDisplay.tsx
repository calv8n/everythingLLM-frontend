interface Props {
    message: string,
    onRetry: () => void;
}

export default function ErrorDisplay({ message, onRetry }: Props) {
    return (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  color="currentColor"
                  strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-red-400 mb-1">
                        Task Failed
                    </h3>
                    <pre className="text-sm text-red-300/80 whitespace-pre-wrap break-words">
                        {message}
                    </pre>
                  </div>
            </div>
            <div className="m1-4 flex justify-end">
                <button
                  onClick={onRetry}
                  className="px-4 py-2 text-sm bg-red-900/50 text-red-300 rounded-lg hover:bg-red-900/70 transition-colors"
                  >
                    Try Again
                  </button>
            </div>
        </div>
    )
}