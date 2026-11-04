export async function fetchConfig(): Promise<{ provider: string }> {
    try {
        const res = await fetch("/api/config");
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
            return { provider: "ollama" };
        }
        return await res.json();
    } catch {
        return { provider: "ollama"};
    }
}

export interface CreatedTask {
    taskId: string;
    sessionId: string;
}

export interface TaskFileReference {
    name: string;
    url: string;
    size: number;
}

export async function fetchTaskFiles(taskId: string): Promise<TaskFileReference[]> {
    const res = await fetch(`/api/task/${encodeURIComponent(taskId)}/files`);
    if (!res.ok) {
        throw new Error(`Failed to load task files: ${res.status} ${res.statusText}`);
    }

    const payload: unknown = await res.json();
    if (typeof payload !== "object" || payload === null || !("files" in payload) || !Array.isArray(payload.files)) {
        throw new Error("The task file response had an invalid format.");
    }

    return payload.files.map((file: unknown) => {
        if (
            typeof file !== "object" || file === null ||
            !("name" in file) || typeof file.name !== "string" ||
            !("url" in file) || typeof file.url !== "string" ||
            !("size" in file) || typeof file.size !== "number"
        ) {
            throw new Error("The task file response contained an invalid file entry.");
        }
        return { name: file.name, url: file.url, size: file.size };
    });
}

export type LLMProvider = "ollama" | "groq";

export async function createTask(
    prompt: string,
    provider: LLMProvider,
    groqApiKey?: string,
    groqModel?: string,
    sessionId?: string): Promise<CreatedTask>{
    const body: Record<string, string> = { prompt, provider };
    if (groqApiKey) {
        body.groq_api_key = groqApiKey;
    }
    if (groqModel) {
        body.groq_model = groqModel;
    }
    if (sessionId) {
        body.session_id = sessionId;
    }

    const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(body)
    })
    if (!res.ok) {
        throw new Error(`Failed to create task: ${res.statusText}`);
    }
    const data = await res.json();
    return {
        taskId: data.task_id,
        sessionId: data.session_id,
    };
}

export function connectWebSocket(taskId: string): WebSocket {
    const protocol =  window.location.protocol === "https:" ? "wss" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/${taskId}`);
    return ws
}