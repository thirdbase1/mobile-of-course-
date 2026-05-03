# AgentForge v2

Self-hosted AI coding agent. Give it a task — it writes code, runs it in a sandbox, fixes errors, reads/writes GitHub files, creates PRs, and keeps going until done.

---

## What you need to provide

1. **GitHub OAuth App** (for login + repo access)
2. **Groq API key** (free — for LLaMA 3.3 70B, fastest model)
3. Optionally: OpenRouter key (Claude/GPT-4o), xAI key (Grok-2), Judge0 key (code execution)

That's it. Database is SQLite by default — zero config.

---

## Deploy to pxxl.app — Step by step

pxxl.app works like Railway: connect your GitHub repo, set the root directory and start command, add env vars, and it deploys automatically.

### 1. Create a GitHub OAuth App

Go to **github.com/settings/developers → OAuth Apps → New OAuth App**:

```
Application name:     AgentForge
Homepage URL:         https://your-frontend.pxxl.app
Authorization callback URL: https://your-backend.pxxl.app/auth/github/callback
```

Save the **Client ID** and **Client Secret**.

### 2. Deploy the Backend

In pxxl.app, create a new project:

| Setting | Value |
|---------|-------|
| Repository | `thirdbase1/mobile-of-course-` |
| Branch | `agentforge` |
| Root directory | `agentforge/backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Environment variables** to set on the backend project:

```
SECRET_KEY=<generate a random 64-char string, e.g. openssl rand -hex 32>
FRONTEND_URL=https://your-frontend.pxxl.app
GITHUB_CLIENT_ID=<from step 1>
GITHUB_CLIENT_SECRET=<from step 1>
```

AI keys can also be set here as fallbacks (or added per-user in Settings):
```
GROQ_API_KEY=<optional, users can add in Settings>
OPENROUTER_API_KEY=<optional>
XAI_API_KEY=<optional>
JUDGE0_API_KEY=<optional>
```

The backend URL will be something like `https://agentforge-api.pxxl.app`.

### 3. Deploy the Frontend

Create a second pxxl project:

| Setting | Value |
|---------|-------|
| Repository | same repo |
| Branch | `agentforge` |
| Root directory | `agentforge/frontend` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |

**Environment variables**:
```
BACKEND_URL=https://agentforge-api.pxxl.app
```

### 4. Update the GitHub OAuth callback URL

Go back to your GitHub OAuth App settings and confirm the callback URL is:
```
https://agentforge-api.pxxl.app/auth/github/callback
```

### 5. Open the app and add API keys

1. Open your frontend URL
2. Sign in with GitHub
3. Go to **Settings → API Keys**
4. Add your Groq key (free at console.groq.com)
5. Optionally add Judge0 key for code execution (free tier at rapidapi.com)

---

## Run locally

### Backend
```bash
cd agentforge/backend
pip install -r requirements.txt
# Create .env from .env.example and fill in values
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd agentforge/frontend
npm install
BACKEND_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000

---

## PostgreSQL (optional upgrade)

By default, AgentForge uses SQLite (`agentforge.db` in the backend directory). This works great on pxxl free tier.

To use PostgreSQL, set `DATABASE_URL` on your backend:
```
DATABASE_URL=postgresql://user:password@host:5432/agentforge
```

**Free PostgreSQL options:**
- **Neon.tech** — free tier, serverless, great for pxxl: neon.tech
- **Supabase** — free tier with 500MB: supabase.com
- **pxxl databases** — available on Student+ plans

If using Neon: the connection string format is:
```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Features

| Feature | Detail |
|---------|--------|
| Models | Groq (LLaMA 3.3 70B, Mixtral, LLaMA 8B), OpenRouter (Claude 3.5, GPT-4o, DeepSeek R1), xAI (Grok-2) |
| Tool calling | All 3 providers use OpenAI-compatible format — identical implementation |
| Code execution | Judge0 CE via RapidAPI — isolated sandboxes, 40+ languages |
| GitHub | OAuth login, unlimited repo imports, read/write/delete files, create branches, open PRs |
| Agent loop | Up to 20 tool call iterations per message, parallel tool execution where supported |
| WebSocket streaming | Tokens stream in real time, tool calls shown as expandable cards |
| Code editor | In-browser file browser + CodeMirror editor with syntax highlighting |
| Sessions | Unlimited concurrent sessions, each can have its own repo and model |
| Storage | SQLite (default, zero config) or PostgreSQL |

---

## Agent tool list

1. `execute_code` — run Python, JS, Bash, Go, Rust, Java, TypeScript, C++, Ruby, PHP
2. `github_read_file` — read any file from an imported repo
3. `github_write_file` — create or update a file (auto-commits)
4. `github_list_files` — list directory contents
5. `github_delete_file` — delete a file (auto-commits)
6. `github_search_code` — search for text/patterns within a repo
7. `github_create_branch` — create a new branch
8. `github_create_pr` — open a pull request
9. `github_list_commits` — view recent commit history
10. `web_search` — DuckDuckGo search for docs and info
11. `fetch_url` — read any URL (docs, APIs, raw files)
