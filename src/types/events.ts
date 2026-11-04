export type Phase = "idle" | "planning" | "code" | "executing" | "result" | "error";

export interface FilePayload {
    name: string;
    type?: string;
    encoding?: "base64";
    data?: string;
    url?: string;
    size?: number;
    kind?: string;
}

export interface WSEvent {
    type: "planning" | "code" | "executing" | "log" | "retry" | "result" | "error";
    content: string;
    files?: FilePayload[];
}

export interface TaskResult {
    text: string;
    files: FilePayload[];
    filesError?: string;
}

export interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    stage?: Exclude<Phase, "idle" | "error">;
    planningText?: string;
    code?: string;
    logs?: string[];
    result?: TaskResult | null;
    error?: string | null;
}