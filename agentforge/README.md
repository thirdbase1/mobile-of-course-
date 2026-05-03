# AgentForge

Self-hosted AI coding agent. Give it a task — it writes code, runs it, fixes errors, commits to GitHub, and keeps going until the job is done.

## Quick Start

### Backend (FastAPI)
```bash
cd agentforge/backend
pip install -r requirements.txt
cp ../.env.example .env   # fill in keys
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd agentforge/frontend
npm install
BACKEND_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000, sign in with GitHub, and start a session.

## Deploy to pxxl

### Backend
1. Create a new project → Python → connect your GitHub repo
2. Set root directory: `agentforge/backend`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.example`

### Frontend
1. Create another project → Next.js → same repo
2. Set root directory: `agentforge/frontend`
3. Add env var: `BACKEND_URL=https://your-backend.pxxl.app`

## Features

- **AI Models**: Groq (LLaMA 3.3, Mixtral), OpenRouter (Claude, GPT-4o), xAI (Grok-2)
- **Code Execution**: Judge0 CE — sandboxed, 40+ languages, no server access needed
- **GitHub**: OAuth login, import repos, read/write files, create PRs
- **Agent Loop**: Runs tools in a loop until task complete, max 20 iterations
- **Streaming**: Tokens stream to browser in real time via WebSocket
- **History**: Every message, tool call, and result persisted in PostgreSQL/SQLite
- **Settings**: Per-user API keys, stored encrypted

## API Keys Needed

| Key | Where to get | Required? |
|-----|-------------|-----------|
| Groq | console.groq.com | Yes (default model) |
| OpenRouter | openrouter.ai/keys | Optional |
| xAI | console.x.ai | Optional |
| Judge0 | rapidapi.com/judge0-official | For code execution |
| GitHub OAuth | github.com/settings/developers | Yes (for login) |
