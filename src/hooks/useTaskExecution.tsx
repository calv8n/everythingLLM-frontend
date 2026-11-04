import { useState, useRef, useCallback, useEffect } from "react";
import type { Phase, WSEvent, TaskResult, ConversationMessage } from "../types/events";
import { createTask, connectWebSocket, fetchTaskFiles, type LLMProvider } from "../lib/api";


export function useTaskExecution() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [planningText, setPlanningText] = useState("");
    const [code, setCode] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<TaskResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    
    const wsRef = useRef<WebSocket | null>(null);
    const terminalEventRef = useRef(false);
    const sessionIdRef = useRef<string | null>(null);
    const activeTaskIdRef = useRef<string | null>(null);
    const groqApiKeyRef = useRef<string | undefined>(undefined);
    const groqModelRef = useRef<string | undefined>(undefined);
    const providerRef = useRef<LLMProvider>("ollama");

    useEffect(() => {
        return () => {
            terminalEventRef.current = true;
            wsRef.current?.close(1000, "Task view closed");
            wsRef.current = null;
            sessionIdRef.current = null;
            activeTaskIdRef.current = null;
            groqApiKeyRef.current = undefined;
            groqModelRef.current = undefined;
        };
    }, []);

    const startTask = useCallback(async (
        prompt: string,
        provider: LLMProvider,
        groqApiKey?: string,
        groqModel?: string,
        sessionId?: string,
        isFollowUp = false,
    ) => {
        // Reset State
        activeTaskIdRef.current = null;
        setPlanningText("");
        setCode("");
        setLogs([]);
        setResult(null);
        setError(null);
        setPhase("planning");
        terminalEventRef.current = false;
        setConversation((previous) => [
            ...(isFollowUp ? previous : []),
            { role: "user", content: prompt },
            {
                role: "assistant",
                content: "",
                stage: "planning",
                planningText: "",
                code: "",
                logs: [],
                result: null,
                error: null,
            },
        ]);

        const updateAssistantMessage = (
            update: (message: ConversationMessage) => ConversationMessage,
        ) => {
            setConversation((previous) => {
                const next = [...previous];
                const lastMessage = next[next.length - 1];
                if (lastMessage?.role === "assistant") {
                    next[next.length - 1] = update(lastMessage);
                }
                return next;
            });
        };
        const appendAssistantContent = (content: string) => {
            updateAssistantMessage((message) => ({
                ...message,
                content: message.content + content,
            }));
        };

        try {
            const task = await createTask(prompt, provider, groqApiKey, groqModel, sessionId);
            activeTaskIdRef.current = task.taskId;
            sessionIdRef.current = task.sessionId;
            const ws = connectWebSocket(task.taskId);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                let data: WSEvent;
                try {
                    data = JSON.parse(event.data) as WSEvent;
                } catch {
                    terminalEventRef.current = true;
                    setError("Received an invalid event from the task server.");
                    setPhase("error");
                    updateAssistantMessage((message) => ({
                        ...message,
                        stage: "result",
                        error: "Received an invalid event from the task server.",
                    }));
                    appendAssistantContent("\n\nThe task server returned an invalid event.");
                    ws.close();
                    return;
                }

                switch (data.type) {
                    case "planning":
                        setPlanningText((prev) => prev + data.content);
                        updateAssistantMessage((message) => ({
                            ...message,
                            stage: "planning",
                            planningText: (message.planningText ?? "") + data.content,
                            content: message.content + data.content,
                        }));
                        break;
                    case "code":
                        setCode(data.content);
                        updateAssistantMessage((message) => ({
                            ...message,
                            stage: "code",
                            code: data.content,
                        }));
                        setPhase("code");
                        break;
                    case "executing":
                        updateAssistantMessage((message) => ({
                            ...message,
                            stage: "executing",
                        }));
                        setPhase("executing");
                        break;
                    case "log":
                        setLogs((prev) => [...prev, data.content]);
                        updateAssistantMessage((message) => ({
                            ...message,
                            logs: [...(message.logs ?? []), data.content],
                        }));
                        break;
                    case "retry":
                        setPlanningText("");
                        setCode("");
                        setLogs((prev) => [...prev, data.content]);
                        updateAssistantMessage((message) => ({
                            ...message,
                            stage: "planning",
                            planningText: "",
                            code: "",
                            logs: [...(message.logs ?? []), data.content],
                        }));
                        appendAssistantContent(`\n\n> ${data.content}\n\n`);
                        setPhase("planning");
                        break;
                    case "result": {
                        terminalEventRef.current = true;
                        const taskResult: TaskResult = {
                            text: data.content,
                            files: data.files ?? [],
                        };
                        setResult(taskResult);
                        updateAssistantMessage((message) => ({
                            ...message,
                            stage: "result",
                            result: taskResult,
                        }));
                        setPhase("result");
                        if (taskResult.files.length === 0) {
                            void fetchTaskFiles(task.taskId)
                                .then((files) => {
                                    if (activeTaskIdRef.current !== task.taskId) return;
                                    const resultWithFiles = { ...taskResult, files };
                                    setResult(resultWithFiles);
                                    updateAssistantMessage((message) => ({
                                        ...message,
                                        result: resultWithFiles,
                                    }));
                                })
                                .catch((err: unknown) => {
                                    if (activeTaskIdRef.current !== task.taskId) return;
                                    const resultWithError = {
                                        ...taskResult,
                                        filesError: err instanceof Error
                                            ? err.message
                                            : "Failed to load the task's output files.",
                                    };
                                    setResult(resultWithError);
                                    updateAssistantMessage((message) => ({
                                        ...message,
                                        result: resultWithError,
                                    }));
                                });
                        }
                        break;
                    }
                    case "error":
                        terminalEventRef.current = true;
                        setError(data.content);
                        updateAssistantMessage((message) => ({
                            ...message,
                            stage: "result",
                            error: data.content,
                        }));
                        appendAssistantContent(`\n\n**Task error:** ${data.content}`);
                        setPhase("error");
                        break;
                }

            };
            ws.onerror = () => {
                terminalEventRef.current = true;
                setError("WebSocket connection error");
                updateAssistantMessage((message) => ({
                    ...message,
                    stage: "result",
                    error: "WebSocket connection error",
                }));
                appendAssistantContent("\n\n**Task error:** WebSocket connection error.");
                setPhase("error");
                ws.close();
            };

            ws.onclose = (event) => {
                if (wsRef.current === ws) {
                    wsRef.current = null;
                }
                if (!terminalEventRef.current) {
                    terminalEventRef.current = true;
                    const message = event.reason || "Task connection closed before a result was received.";
                    setError(message);
                    updateAssistantMessage((assistantMessage) => ({
                        ...assistantMessage,
                        stage: "result",
                        error: message,
                    }));
                    appendAssistantContent(`\n\n**Task error:** ${message}`);
                    setPhase("error");
                }
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to start task";
            setError(message);
            updateAssistantMessage((assistantMessage) => ({
                ...assistantMessage,
                stage: "result",
                error: message,
            }));
            appendAssistantContent(`\n\n**Task error:** ${message}`);
            setPhase("error");
        }
    }, []);

    const submitTask = useCallback((
        prompt: string,
        provider: LLMProvider,
        groqApiKey?: string,
        groqModel?: string,
    ) => {
        sessionIdRef.current = null;
        providerRef.current = provider;
        groqApiKeyRef.current = groqApiKey;
        groqModelRef.current = groqModel;
        void startTask(prompt, provider, groqApiKey, groqModel, undefined, false);
    }, [startTask]);

    const submitFollowUp = useCallback((
        prompt: string,
        provider: LLMProvider,
        groqApiKey?: string,
        groqModel?: string,
    ) => {
        if (!sessionIdRef.current) {
            setError("This task session has expired. Start a new task to continue.");
            setPhase("error");
            return;
        }
        providerRef.current = provider;
        if (provider === "groq") {
            groqApiKeyRef.current = groqApiKey;
            groqModelRef.current = groqModel;
        } else {
            groqApiKeyRef.current = undefined;
            groqModelRef.current = undefined;
        }
        void startTask(
            prompt,
            providerRef.current,
            groqApiKeyRef.current,
            groqModelRef.current,
            sessionIdRef.current,
            true,
        );
    }, [startTask]);

    const reset = useCallback(() => {
        terminalEventRef.current = true;
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setPhase("idle");
        setPlanningText("");
        setCode("");
        setLogs([]);
        setResult(null);
        setError(null);
        setConversation([]);
        activeTaskIdRef.current = null;
        sessionIdRef.current = null;
        groqApiKeyRef.current = undefined;
        groqModelRef.current = undefined;
        providerRef.current = "ollama";
    }, []);

    return {
        phase,
        planningText,
        code,
        logs,
        result,
        error,
        conversation,
        submitTask,
        submitFollowUp,
        reset,
    };
}