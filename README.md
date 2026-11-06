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

Vite serves the frontend at `http://localhost:5173`. During `npm run dev`, its proxy always sends `/api` and `/ws` requests to `http://127.0.0.1:8000`, regardless of API URL environment variables. Production builds send API, WebSocket, and artifact requests to `http://129.225.68.122:8080`; set `VITE_API_BASE_URL` at build time to override that production host.

Build, lint, and preview a production build:

```bash
npm run build
npm run lint
npm run preview
```

## Deploy the production frontend to Vercel

Import the repository into Vercel and set the project root to `frontend`. Use `npm run build` as the build command and `dist` as the output directory. Set this environment variable for Production (and Preview if previews should use the live backend):

```text
VITE_API_BASE_URL=https://api.example.com
```

Replace `https://api.example.com` with the HTTPS origin serving your backend. Vercel serves the frontend over HTTPS, so browsers will block requests to the current plain-HTTP API URL (`http://129.225.68.122:8080`) as mixed content. Configure HTTPS for the API first, for example by pointing an API subdomain at the VM and configuring Caddy to serve that hostname.

On the backend, set `FRONTEND_ORIGIN` in `backend/.env.production` to the exact Vercel site origin, such as `https://your-project.vercel.app` (no trailing slash), then restart the backend container. Add any custom Vercel domain as an additional comma-separated origin. CORS is enforced by the backend.

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
