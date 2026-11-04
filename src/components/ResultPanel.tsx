import { useEffect, useState } from "react";
import type { TaskResult } from "../types/events";
import { backendUrl } from "../lib/api";
import MarkdownContent from "./MarkdownContent";

interface Props {
  result: TaskResult;
}

function parseCsv(contents: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];

    if (character === '"') {
      if (quoted && contents[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && contents[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (rows[0]?.[0]?.startsWith("\uFEFF")) {
    rows[0][0] = rows[0][0].slice(1);
  }
  return rows;
}

function decodeBase64Utf8(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function inlineUrl(url: string): string {
  const resolvedUrl = backendUrl(url);
  return `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}inline=true`;
}

export default function ResultPanel({ result }: Props) {
  return (
    <div className="bg-gray-900 border border-green-800/50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium text-green-400">Result</span>
      </div>
 
      <div className="p-4 space-y-4">
        {/* Text output */}
        {result.text && (
          <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-950 p-4 text-sm">
            <MarkdownContent content={result.text} />
          </div>
        )}
        {result.filesError && (
          <p className="rounded-lg border border-amber-800/50 bg-gray-950 p-3 text-sm text-amber-300">
            {result.filesError}
          </p>
        )}
 
        {/* Files */}
        {result.files.length > 0 && (
          <div className="space-y-3">
            {result.files.map((file, i) => (
              <div key={i}>
                {(file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) && (
                  <CsvPreview fileName={file.name} base64Data={file.data} url={file.url} />
                )}
                {file.type?.startsWith("image/") ? (
                  <div className="space-y-2">
                    <img
                      src={
                        file.data
                          ? `data:${file.type};base64,${file.data}`
                          : file.url
                            ? inlineUrl(file.url)
                            : undefined
                      }
                      alt={file.name}
                      className="max-w-full rounded-lg border border-gray-800"
                    />
                    <FileDownloadLink file={file} />
                  </div>
                ) : file.type === "text/html" || /\.html?$/i.test(file.name) ? (
                  <HtmlPreview fileName={file.name} base64Data={file.data} url={file.url} />
                ) : (
                  <FileDownloadLink file={file} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileDownloadLink({ file }: { file: TaskResult["files"][number] }) {
  const href = file.url ? backendUrl(file.url) : (
    file.data ? `data:${file.type ?? "application/octet-stream"};base64,${file.data}` : undefined
  );
  if (!href) {
    return (
      <p className="rounded-lg border border-amber-800/50 bg-gray-950 p-3 text-sm text-amber-300">
        {file.name} was listed by the backend but no download data or URL was provided.
      </p>
    );
  }

  return (
    <a
      href={href}
      download={file.url ? undefined : file.name}
      className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
    >
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <div>
        <p className="text-sm text-gray-300">{file.name}</p>
        <p className="text-xs text-gray-500">{file.type ?? "File"}{file.size ? ` · ${file.size} bytes` : ""}</p>
      </div>
      <span className="ml-auto text-xs text-blue-400">Download</span>
    </a>
  );
}

function HtmlPreview({
  fileName,
  base64Data,
  url,
}: {
  fileName: string;
  base64Data?: string;
  url?: string;
}) {
  let html: string | undefined;
  if (base64Data) {
    try {
      html = decodeBase64Utf8(base64Data);
    } catch {
      if (!url) {
        return (
          <p className="rounded-lg border border-red-800/50 bg-gray-950 p-3 text-sm text-red-300">
            Could not preview {fileName}: the HTML file could not be decoded.
          </p>
        );
      }
    }
  }

  if (!html && !url) {
    return (
      <p className="rounded-lg border border-amber-800/50 bg-gray-950 p-3 text-sm text-amber-300">
        Could not preview {fileName}: no file data or URL was provided.
      </p>
    );
  }

  const iframeSource = html ? { srcDoc: html } : url ? { src: inlineUrl(url) } : {};

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700">
      <div className="flex items-center justify-between gap-3 border-b border-gray-700 bg-gray-800 px-3 py-2">
        <p className="truncate text-xs font-medium text-gray-200">Graph preview · {fileName}</p>
        <FileDownloadLink file={{ name: fileName, type: "text/html", data: base64Data, url }} />
      </div>
      <iframe
        title={`Preview of ${fileName}`}
        {...iframeSource}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        loading="lazy"
        className="h-[520px] w-full bg-white"
      />
    </div>
  );
}

function CsvPreview({
  fileName,
  base64Data,
  url,
}: {
  fileName: string;
  base64Data?: string;
  url?: string;
}) {
  const [remoteResult, setRemoteResult] = useState<{
    url: string;
    contents?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (base64Data || !url) return;

    const controller = new AbortController();
    void fetch(inlineUrl(url), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${fileName}: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((text) => {
        setRemoteResult({ url, contents: text });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setRemoteResult({
          url,
          error: err instanceof Error ? err.message : `Failed to load ${fileName}.`,
        });
      });

    return () => controller.abort();
  }, [base64Data, fileName, url]);

  let contents: string | null = null;
  let error: string | null = null;
  if (base64Data) {
    try {
      contents = decodeBase64Utf8(base64Data);
    } catch {
      error = `Could not preview ${fileName}: the CSV file could not be decoded.`;
    }
  } else if (url && remoteResult?.url === url) {
    contents = remoteResult.contents ?? null;
    error = remoteResult.error ?? null;
  }

  const rows = contents === null ? null : parseCsv(contents);

  if (error) {
    return (
      <p className="rounded-lg border border-amber-800/50 bg-gray-950 p-3 text-sm text-amber-300">
        {error}
      </p>
    );
  }
  if (!rows || rows.length === 0) return null;
  const [headers, ...dataRows] = rows;

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-gray-700">
      <p className="border-b border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300">
        Table preview · {fileName}
      </p>
      <div className="max-h-80 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-gray-800 text-gray-100">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border-b border-gray-700 px-3 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((dataRow, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-gray-900 even:bg-gray-950">
                {headers.map((_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="border-t border-gray-800 px-3 py-2 text-gray-300"
                  >
                    {dataRow[columnIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}