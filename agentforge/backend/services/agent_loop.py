"""
Agent loop — drives the AI model through a multi-step tool-calling loop.
"""
import json, os, uuid, logging, asyncio
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import Session, Message, User, ApiSettings, Repo
from services.tools import TOOL_DEFINITIONS, execute_tool
from services.workspace import clone_repo_to_workspace, init_workspace, get_workspace_path

log = logging.getLogger(__name__)

MAX_ITER   = 20
MAX_HIST   = 60

SYSTEM_PROMPT = """\
You are Agent Forge, a highly capable autonomous software engineering agent.

Your purpose is to design, build, run, and manage complete software projects inside a sandboxed development environment. You behave like a real developer working on a local machine — not a chatbot.

---

## CORE PRINCIPLES

1. SANDBOX-FIRST
You operate inside a persistent sandbox environment at /tmp/agentforge/{session_id}. This contains:
- A full file system
- A terminal for executing commands
- Running processes (servers, builds)
- Logs and outputs

You MUST maintain awareness of:
- Existing files and project structure
- Installed dependencies
- Running services
- Previous commands and their outputs

Never assume a clean environment. Always inspect before acting.

---

2. AUTONOMOUS DEVELOPMENT BEHAVIOR

You can:
- Create, read, update, and delete files
- Execute terminal commands
- Install dependencies
- Run applications and servers
- Debug errors and fix them iteratively

You should:
- Break problems into steps
- Act, observe results, and adjust
- Retry intelligently when something fails

You are NOT limited to suggesting code — you EXECUTE and VERIFY.

---

3. COMMAND EXECUTION

When you need to run a command:
- Clearly specify the command
- Explain why it is being executed
- Wait for output before proceeding
- Analyze logs and errors before next action

Never run destructive commands unless explicitly required.

---

4. FILE OPERATIONS

When modifying files:
- Be precise and minimal
- Respect existing project structure
- Avoid unnecessary rewrites
- Ensure consistency across files

Always consider how changes affect the running system.

---

5. SANDBOX AWARENESS

You must always:
- Understand the current state of the sandbox
- Avoid redundant installations or duplicate processes
- Check if a server is already running before starting another
- Reuse existing resources where possible

---

6. GITHUB IS OPTIONAL

GitHub is NOT required.

If GitHub is connected:
- You may clone repositories into the sandbox
- You may commit and push changes
- You may create new repositories when requested

If GitHub is NOT connected:
- Continue working fully within the sandbox

Never block progress due to missing GitHub.

---

7. TRANSPARENCY

All actions must be visible and explainable:
- Commands executed
- Files modified
- Reasoning behind decisions

Keep explanations concise but clear.

---

8. REASONING

For complex tasks:
- Think step-by-step internally
- Provide a structured explanation when necessary

Do NOT expose unnecessary internal chain-of-thought unless explicitly requested.
Instead, summarize reasoning clearly.

---

9. ERROR HANDLING

When something fails:
- Read and interpret the error
- Identify the root cause
- Apply a fix
- Retry

Do not loop blindly. Adapt intelligently.

---

10. MODEL CAPABILITIES

You may be powered by models that support:
- Tool calling
- Reasoning

Use these capabilities effectively:
- Choose the right tools when needed
- Provide structured outputs for actions

---

## RESPONSE FORMAT

When taking actions, structure responses clearly:

1. PLAN (if needed)
- What you are about to do

2. ACTION
- Command to run OR file changes

3. RESULT (after execution)
- Output summary or next step

Keep responses clean and developer-focused.

---


---

## BRANCHING RULES
- If a repository is connected, you MUST NOT work directly on the default branch (main/master).
- You MUST create a new feature branch before making any changes.
- Branch names should be derived from the user intent:
  - Fix: fix/description
  - Feature: feat/description
  - Refactor: refactor/description
- Example: "Fix layout issues" -> fix/layout-issues
- You must switch to this branch and perform all work there.
\n## GOAL

Your goal is to:
- Build fully working systems
- Ensure they run correctly in the sandbox
- Help users ship real projects

You are not just assisting — you are BUILDING.

Act like a senior engineer with full control of the environment.
"""

PROVIDERS = {
    "groq": {
        "url":     "https://api.groq.com/openai/v1/chat/completions",
        "models":  {
            "llama-3.3-70b":  "llama-3.3-70b-versatile",
            "llama-3.1-70b":  "llama-3.1-70b-versatile",
            "mixtral-8x7b":   "mixtral-8x7b-32768",
            "llama-3.1-8b":   "llama-3.1-8b-instant",
            "deepseek-r1-distill-llama-70b": "deepseek-r1-distill-llama-70b",
            "qwen-32b":       "qwen-2.5-32b",
            "compound-mini":  "groq-compound-mini",
            "compound":       "groq-compound",
        },
        "parallel_tool_calls": False,
    },
    "xai": {
        "url":    "https://api.x.ai/v1/chat/completions",
        "models": {
            "grok-2":      "grok-2-latest",
            "grok-2-mini": "grok-2-vision-1212",
            "grok-beta":   "grok-beta",
            "grok-latest": "grok-latest",
            "grok-3":    "grok-3",
        },
        "parallel_tool_calls": True,
    },
}

def _resolve_model(model_str: str):
    parts    = model_str.split("/", 1)
    provider = parts[0] if len(parts) > 1 else "groq"
    model_id = parts[1] if len(parts) > 1 else parts[0]
    cfg      = PROVIDERS.get(provider, PROVIDERS["groq"])
    api_name = cfg["models"].get(model_id, model_id)
    return provider, api_name, cfg

def _get_api_key(provider: str, api_settings, env_fallbacks: dict) -> str | None:
    key_map = {
        "groq":       ("groq_api_key",       "GROQ_API_KEY"),
        "openrouter": ("openrouter_api_key",  "OPENROUTER_API_KEY"),
        "xai":        ("xai_api_key",         "XAI_API_KEY"),
    }
    attr, env = key_map.get(provider, ("groq_api_key", "GROQ_API_KEY"))
    return (getattr(api_settings, attr, None) if api_settings else None) or os.getenv(env)

async def run_agent_loop(
    websocket:    WebSocket,
    db:           AsyncSession,
    session:      Session,
    user:         User,
    api_settings: ApiSettings | None,
    model:        str,
):
    provider, api_model, cfg = _resolve_model(model)
    api_key = _get_api_key(provider, api_settings, {})

    if not api_key:
        await websocket.send_json({"type": "error", "message": f"No API key for {provider}."})
        return

    # Initialize workspace
    await init_workspace(session.id)
    await websocket.send_json({"type": "info", "message": "Initializing high-capacity sandbox..."})

    # Tool execution context
    tool_ctx = {
        "github_token": user.github_token,
        "session_id":   session.id,
        "db":           db,
        "user":         user,
    }

    # Load repo info if session has one
    repo_info = ""
    if session.repo_id:
        repo = (await db.execute(select(Repo).where(Repo.id == session.repo_id))).scalar_one_or_none()
        if repo:
            await websocket.send_json({"type": "info", "message": f"Cloning repository {repo.full_name}..."})
            ok, msg = await clone_repo_to_workspace(session.id, repo.full_name, user.github_token, repo.default_branch)
            if not ok:
                await websocket.send_json({"type": "error", "message": f"Failed to initialize workspace: {msg}"})
                return
            repo_info = f"\n## Active Repository\nRepo: {repo.full_name}\nDefault branch: {repo.default_branch}\n"
            tool_ctx["default_repo"]   = repo.full_name
            tool_ctx["default_branch"] = repo.default_branch

    # Build conversation history
    hist = (await db.execute(select(Message).where(Message.session_id == session.id).order_by(Message.created_at))).scalars().all()
    messages = [{"role": "system", "content": SYSTEM_PROMPT.replace("{session_id}", session.id) + repo_info}]

    for m in hist:
        if m.role == "user": messages.append({"role": "user", "content": m.content})
        elif m.role == "assistant" and m.content: messages.append({"role": "assistant", "content": m.content})
        elif m.role == "tool_call":
            messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": m.tool_call_id, "type": "function", "function": {"name": m.tool_name, "arguments": json.dumps(m.tool_input)}}]})
        elif m.role == "tool_result":
            messages.append({"role": "tool", "tool_call_id": m.tool_call_id, "content": m.tool_output})

    if len(messages) > MAX_HIST + 1: messages = [messages[0]] + messages[-(MAX_HIST):]

    iteration = 0
    while iteration < MAX_ITER:
        iteration += 1
        asst_id = str(uuid.uuid4())
        full_content, tool_calls = "", []

        await websocket.send_json({"type": "message_start", "id": asst_id})

        async for event in _stream_model(PROVIDERS[provider]["url"], api_key, provider, api_model, messages, TOOL_DEFINITIONS, cfg.get("parallel_tool_calls", False)):
            if event["type"] == "token":
                full_content += event["content"]
                await websocket.send_json({"type": "token", "content": event["content"]})
            elif event["type"] == "tool_calls":
                tool_calls = event["tool_calls"]
            elif event["type"] == "error":
                await websocket.send_json({"type": "error", "message": event["message"]})
                return

        db.add(Message(id=asst_id, session_id=session.id, role="assistant", content=full_content or None))
        await db.commit()
        messages.append({"role": "assistant", "content": full_content or None, "tool_calls": tool_calls or None})

        if not tool_calls:
            await websocket.send_json({"type": "done"})
            return

        for tc in tool_calls:
            fn_name = tc["function"]["name"]
            fn_args = json.loads(tc["function"]["arguments"] or "{}")
            tc_id   = tc.get("id", str(uuid.uuid4()))

            status_map = {
                "run_bash": "Running command...",
                "write_file": "Editing file...",
                "read_file": "Reading file...",
                "list_files": "Scanning workspace...",
                "search_files": "Searching...",
                "analyze_codebase": "Analyzing project...",
                "github_commit_and_push": "Pushing to GitHub...",
                "github_create_repository": "Creating repository...",
                "web_search": "Searching the web...",
            }
            await websocket.send_json({"type": "status", "message": status_map.get(fn_name, "Thinking...")})

            call_id = str(uuid.uuid4())
            await websocket.send_json({"type": "tool_call", "id": call_id, "tc_id": tc_id, "tool_name": fn_name, "tool_input": fn_args})
            db.add(Message(id=call_id, session_id=session.id, role="tool_call", tool_name=fn_name, tool_call_id=tc_id, tool_input=fn_args))
            await db.commit()

            output = await execute_tool(fn_name, fn_args, tool_ctx)
            await websocket.send_json({"type": "tool_result", "id": call_id, "tc_id": tc_id, "output": output[:8000]})
            db.add(Message(session_id=session.id, role="tool_result", tool_call_id=tc_id, tool_output=output[:16000]))
            await db.commit()
            messages.append({"role": "tool", "tool_call_id": tc_id, "content": output[:10000]})

async def _stream_model(url, api_key, provider, model, messages, tools, parallel):
    import httpx
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "tools": tools, "stream": True, "max_tokens": 4096}
    if parallel: payload["parallel_tool_calls"] = True

    acc = {}
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                yield {"type": "error", "message": f"API error {resp.status_code}"}
                return
            async for line in resp.aiter_lines():
                if not line.startswith("data: "): continue
                raw = line[6:].strip()
                if raw == "[DONE]": break
                try:
                    chunk = json.loads(raw)
                    delta = chunk["choices"][0]["delta"]
                    if delta.get("content"): yield {"type": "token", "content": delta["content"]}
                    for tc in delta.get("tool_calls", []):
                        idx = tc.get("index", 0)
                        if idx not in acc: acc[idx] = {"id": "", "type": "function", "function": {"name": "", "arguments": ""}}
                        if tc.get("id"): acc[idx]["id"] = tc["id"]
                        if tc.get("function", {}).get("name"): acc[idx]["function"]["name"] += tc["function"]["name"]
                        if tc.get("function", {}).get("arguments"): acc[idx]["function"]["arguments"] += tc["function"]["arguments"]
                except: continue
    if acc: yield {"type": "tool_calls", "tool_calls": list(acc.values())}
