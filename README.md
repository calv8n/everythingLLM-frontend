# EverythingLLM Frontend

React, TypeScript, Vite, and Tailwind CSS chat UI for the EverythingLLM task runner. The frontend submits prompts and streams planning, code, execution logs, results, and output files from the FastAPI backend.

## Requirements

- Node.js and npm
- Backend running at `http://127.0.0.1:8000` for task requests
- Ollama running locally for local-model requests, or a Groq API key and model for Groq requests

## Install and run

From this directory:

```bash
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. Its development proxy forwards `/api` requests and `/ws` WebSocket connections to the backend at port 8000, as configured in `vite.config.ts`.

If the backend requires bearer authentication, set `DEMO_TOKEN` in `frontend/.env.local`. Vite adds it to proxied API and WebSocket requests on the server side; it is not included in the frontend bundle. Do not commit the token.

Build, lint, and preview a production build:

```bash
npm run build
npm run lint
npm run preview
```

## Provider selection

The development server allows selecting **Ollama · local** or **Groq · API**. Production builds default to Groq and show only the Groq option; the backend independently rejects Ollama requests in production.

- Ollama uses the backend-configured Ollama model.
- Groq requires both an API key and model name. The browser prevents submission if either value is blank or the required Groq fields are not mounted; the backend independently validates both fields.
- Groq credentials are kept in frontend component state and sent with each Groq task request. They are not written to local storage or session memory.
- Follow-up prompts reuse the task session. The user can change providers; Groq credentials are only sent when Groq is selected.

## Chat and task UI

- Persistent chat transcript with distinct user and agent roles; conversation scrolling is in the main chat area.
- Dark/light theme choice is stored in browser local storage.
- Each agent turn has Planning, Code, Executing, and Result tabs.
- The composer supports Enter to send and Shift+Enter for a newline.
- Markdown, CSV table previews, inline images, downloadable files, and HTML graph previews are supported.
- HTML output is shown in a sandboxed iframe and can also be downloaded.

## API contract

Task creation uses `POST /api/task` with JSON fields:

```json
{
  "prompt": "Create a chart",
  "provider": "groq",
  "groq_api_key": "user-supplied-key",
  "groq_model": "openai/gpt-oss-120b",
  "session_id": "optional-existing-session-id"
}
```

For Ollama, send `"provider": "ollama"` and omit the Groq fields. The response includes `task_id` and `session_id`. Connect to `/ws/{task_id}` to receive task events. Frontend event and artifact types are maintained in `src/types/events.ts`.

The frontend displays the result text from the WebSocket `result` event and previews or downloads its files. If the event has no file payloads, it loads the persisted file list from `GET /api/task/{task_id}/files`; file links are served by `GET /api/task/{task_id}/files/{file_name}`.

## Source layout

- `src/App.tsx`: chat shell, provider/theme state, composer-to-task wiring
- `src/components/ChatComposer.tsx`: prompt composer and provider/model fields
- `src/components/ConversationThread.tsx`: chat messages and per-agent task tabs
- `src/components/ResultPanel.tsx`: text, CSV, image, and HTML results
- `src/hooks/useTaskExecution.tsx`: task state, WebSocket events, and follow-ups
- `src/lib/api.ts`: HTTP and WebSocket client
- `src/types/events.ts`: task event and result types
