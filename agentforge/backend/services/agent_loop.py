"""
Agent loop — drives the AI model through a multi-step tool-calling loop.

All three providers use identical OpenAI-compatible format:
  - Groq:       https://api.groq.com/openai/v1/chat/completions
  - OpenRouter: https://openrouter.ai/api/v1/chat/completions
  - xAI Grok:   https://api.x.ai/v1/chat/completions

Tool calling format: tools=[{type:"function", function:{name, description, parameters}}]
Streaming:          stream=True, read SSE lines, accumulate tool_calls deltas
Parallel tools:     all three providers support parallel tool calls in one response
"""
import json, os, uuid, logging, asyncio
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import Session, Message, User, ApiSettings, Repo
from services.tools import TOOL_DEFINITIONS, execute_tool

log = logging.getLogger(__name__)

MAX_ITER   = 20
MAX_HIST   = 60   # messages kept in context (newest)

SYSTEM_PROMPT = """\
You are AgentForge, a senior software engineer with full access to code execution and GitHub.

## What you can do
- Write and run code (Python, JS, Bash, Go, Rust, Java, TypeScript, and more)
- Read, create, update, and delete files in any imported GitHub repository
- Create branches, commit code, and open pull requests
- Search within repos and across the web
- Fetch any URL for documentation or data

## How to work
1. **Act first, ask later** — start working immediately. Don't ask for clarification on things you can figure out.
2. **Verify everything** — after writing code, execute it. After writing files, confirm they exist. Never claim success without verifying.
3. **Fix your own errors** — if code fails, read the error, fix it, and run again. Don't give up after one attempt.
4. **Be methodical** — for multi-step tasks, explain your plan briefly then execute step by step.
5. **Use parallel tools** — when multiple files need reading or multiple independent operations need doing, call tools in the same response.
6. **Complete the task** — keep going until the user's request is fully done. Only stop when there's nothing left to do.

## When working with a repo
- Start by listing files to understand the structure
- Read relevant files before modifying them
- Write meaningful commit messages
- Test code before committing when possible

## Response style
- Be direct and concise in your text responses
- Show tool calls and results — don't hide your work
- When done, give a clear summary of what was accomplished
"""


# ─── Model provider config ─────────────────────────────────────────────────────

PROVIDERS = {
    "groq": {
        "url":     "https://api.groq.com/openai/v1/chat/completions",
        "models":  {
            "llama-3.3-70b":  "llama-3.3-70b-versatile",
            "llama-3.1-70b":  "llama-3.1-70b-versatile",
            "mixtral-8x7b":   "mixtral-8x7b-32768",
            "llama-3.1-8b":   "llama-3.1-8b-instant",
        },
        "parallel_tool_calls": True,
    },
    "openrouter": {
        "url":    "https://openrouter.ai/api/v1/chat/completions",
        "models": {
            "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
            "claude-3-haiku":    "anthropic/claude-3-haiku",
            "gpt-4o":            "openai/gpt-4o",
            "gpt-4o-mini":       "openai/gpt-4o-mini",
            "deepseek-r1":       "deepseek/deepseek-r1",
            "qwen-72b":          "qwen/qwen-2.5-72b-instruct",
        },
        "parallel_tool_calls": False,  # depends on underlying model
    },
    "xai": {
        "url":    "https://api.x.ai/v1/chat/completions",
        "models": {
            "grok-2":      "grok-2-latest",
            "grok-2-mini": "grok-2-vision-1212",
            "grok-beta":   "grok-beta",
        },
        "parallel_tool_calls": True,
    },
}


def _resolve_model(model_str: str):
    """'groq/llama-3.3-70b' → (provider_str, api_model_name, config)"""
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


# ─── Main loop ─────────────────────────────────────────────────────────────────

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
    judge0  = (getattr(api_settings, "judge0_api_key", None) if api_settings else None) or os.getenv("JUDGE0_API_KEY")

    if not api_key:
        await websocket.send_json({
            "type":    "error",
            "message": f"No API key for {provider}. Go to Settings and add your {provider.upper()} key.",
        })
        return

    # Tool execution context
    tool_ctx = {
        "github_token": user.github_token,
        "judge0_key":   judge0,
        "db":           db,
        "user":         user,
    }

    # Load repo info if session has one
    repo_info = ""
    if session.repo_id:
        repo = (await db.execute(select(Repo).where(Repo.id == session.repo_id))).scalar_one_or_none()
        if repo:
            repo_info = (
                f"\n## Active Repository\n"
                f"Repo: {repo.full_name}\n"
                f"Default branch: {repo.default_branch}\n"
                f"Language: {repo.language or 'unknown'}\n"
                f"When working with this repo, use repo='{repo.full_name}' and branch='{repo.default_branch}' unless told otherwise.\n"
            )
            # Pass default branch to tool context
            tool_ctx["default_repo"]   = repo.full_name
            tool_ctx["default_branch"] = repo.default_branch

    # Build conversation history from DB
    hist = (await db.execute(
        select(Message).where(Message.session_id == session.id).order_by(Message.created_at)
    )).scalars().all()

    # Convert to OpenAI message format
    messages = [{"role": "system", "content": SYSTEM_PROMPT + repo_info}]

    # Group messages: assistant messages with tool_calls need their tool results immediately after
    i = 0
    hist_list = list(hist)
    while i < len(hist_list):
        m = hist_list[i]
        if m.role == "user":
            messages.append({"role": "user", "content": m.content or ""})
            i += 1
        elif m.role == "assistant":
            messages.append({"role": "assistant", "content": m.content or ""})
            i += 1
        elif m.role == "tool_call":
            # Find the corresponding tool result
            asst_msg = {
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id":       m.tool_call_id or m.id[:9],
                    "type":     "function",
                    "function": {"name": m.tool_name or "", "arguments": json.dumps(m.tool_input or {})},
                }]
            }
            messages.append(asst_msg)
            # Look for result
            if i + 1 < len(hist_list) and hist_list[i+1].role == "tool_result":
                r = hist_list[i+1]
                messages.append({
                    "role":         "tool",
                    "tool_call_id": r.tool_call_id or m.tool_call_id or m.id[:9],
                    "content":      r.tool_output or "",
                })
                i += 2
            else:
                messages.append({
                    "role":         "tool",
                    "tool_call_id": m.tool_call_id or m.id[:9],
                    "content":      "(no result)",
                })
                i += 1
        else:
            i += 1

    # Trim history if too long
    if len(messages) > MAX_HIST + 1:
        messages = [messages[0]] + messages[-(MAX_HIST):]

    # ── Main loop ──────────────────────────────────────────────────────────────
    iteration = 0
    while iteration < MAX_ITER:
        iteration += 1

        asst_id       = str(uuid.uuid4())
        full_content  = ""
        tool_calls    : list[dict] = []

        await websocket.send_json({"type": "message_start", "id": asst_id})

        # Stream from model
        try:
            async for event in _stream_model(
                url       = PROVIDERS.get(provider, PROVIDERS["groq"])["url"],
                api_key   = api_key,
                provider  = provider,
                model     = api_model,
                messages  = messages,
                tools     = TOOL_DEFINITIONS,
                parallel  = cfg.get("parallel_tool_calls", False),
            ):
                if event["type"] == "token":
                    full_content += event["content"]
                    await websocket.send_json({"type": "token", "content": event["content"]})
                elif event["type"] == "tool_calls":
                    tool_calls = event["tool_calls"]
                elif event["type"] == "error":
                    await websocket.send_json({"type": "error", "message": event["message"]})
                    session.status = "error"
                    await db.commit()
                    return
        except Exception as e:
            log.exception("Stream error")
            await websocket.send_json({"type": "error", "message": f"Model stream error: {e}"})
            session.status = "error"
            await db.commit()
            return

        # Persist assistant message
        asst_db = Message(id=asst_id, session_id=session.id, role="assistant", content=full_content or None)
        db.add(asst_db)
        await db.commit()

        # Add assistant turn to in-memory messages
        asst_msg: dict = {"role": "assistant", "content": full_content or None}
        if tool_calls:
            asst_msg["tool_calls"] = tool_calls
        messages.append(asst_msg)

        # No tool calls → agent is done
        if not tool_calls:
            session.status = "idle"
            await db.commit()
            await websocket.send_json({"type": "done"})
            return

        # Execute all tool calls (possibly in parallel)
        tool_results = []
        tasks = []
        for tc in tool_calls:
            fn_name = tc.get("function", {}).get("name", "")
            try:
                fn_args = json.loads(tc.get("function", {}).get("arguments", "{}"))
            except Exception:
                fn_args = {}
            tc_id = tc.get("id", str(uuid.uuid4()))

            # Stream tool call event immediately
            call_msg_id = str(uuid.uuid4())
            await websocket.send_json({
                "type":       "tool_call",
                "id":         call_msg_id,
                "tc_id":      tc_id,
                "tool_name":  fn_name,
                "tool_input": fn_args,
            })

            # Persist tool call
            call_db = Message(
                id=call_msg_id, session_id=session.id, role="tool_call",
                tool_name=fn_name, tool_call_id=tc_id, tool_input=fn_args,
            )
            db.add(call_db)

            tasks.append((tc_id, call_msg_id, fn_name, fn_args))

        await db.commit()

        # Execute tools — in parallel if provider supports it, sequential otherwise
        if cfg.get("parallel_tool_calls") and len(tasks) > 1:
            async def _run(t):
                tc_id, call_msg_id, fn_name, fn_args = t
                output = await execute_tool(fn_name, fn_args, tool_ctx)
                return tc_id, call_msg_id, output
            results = await asyncio.gather(*[_run(t) for t in tasks], return_exceptions=True)
        else:
            results = []
            for t in tasks:
                tc_id, call_msg_id, fn_name, fn_args = t
                output = await execute_tool(fn_name, fn_args, tool_ctx)
                results.append((tc_id, call_msg_id, output))

        # Stream results and persist
        for item in results:
            if isinstance(item, Exception):
                tc_id, call_msg_id = tasks[results.index(item)][:2]
                output = f"Tool execution error: {item}"
            else:
                tc_id, call_msg_id, output = item

            output_str = output if isinstance(output, str) else json.dumps(output)

            await websocket.send_json({
                "type":   "tool_result",
                "id":     call_msg_id,
                "output": output_str[:6000],
            })

            result_db = Message(
                session_id=session.id, role="tool_result",
                tool_call_id=tc_id, tool_output=output_str[:12000],
            )
            db.add(result_db)
            tool_results.append({"role": "tool", "tool_call_id": tc_id, "content": output_str[:8000]})

        await db.commit()
        messages.extend(tool_results)

    # Exceeded max iterations
    session.status = "idle"
    await db.commit()
    await websocket.send_json({
        "type":    "error",
        "message": f"Reached {MAX_ITER} iterations. Task may need to be broken into smaller steps.",
    })


# ─── Model streaming ───────────────────────────────────────────────────────────

async def _stream_model(url, api_key, provider, model, messages, tools, parallel):
    import httpx

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if provider == "openrouter":
        headers["HTTP-Referer"] = "https://agentforge.app"
        headers["X-Title"]      = "AgentForge"

    payload: dict = {
        "model":    model,
        "messages": messages,
        "tools":    tools,
        "stream":   True,
        "max_tokens": 4096,
        "tool_choice": "auto",
    }
    if parallel and provider in ("groq", "xai"):
        payload["parallel_tool_calls"] = True

    acc: dict[int, dict] = {}  # accumulate streamed tool_calls deltas

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                try:
                    err = json.loads(body).get("error", {})
                    msg = err.get("message", body.decode()[:300])
                except Exception:
                    msg = body.decode()[:300]
                yield {"type": "error", "message": f"API error {resp.status_code}: {msg}"}
                return

            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:].strip()
                if raw == "[DONE]":
                    break
                try:
                    chunk = json.loads(raw)
                except Exception:
                    continue

                choice = chunk.get("choices", [{}])[0]
                delta  = choice.get("delta", {})

                if delta.get("content"):
                    yield {"type": "token", "content": delta["content"]}

                for tc in delta.get("tool_calls", []):
                    idx = tc.get("index", 0)
                    if idx not in acc:
                        acc[idx] = {"id": "", "type": "function", "function": {"name": "", "arguments": ""}}
                    if tc.get("id"):
                        acc[idx]["id"] = tc["id"]
                    fn = tc.get("function", {})
                    if fn.get("name"):
                        acc[idx]["function"]["name"] += fn["name"]
                    if fn.get("arguments"):
                        acc[idx]["function"]["arguments"] += fn["arguments"]

    if acc:
        yield {"type": "tool_calls", "tool_calls": list(acc.values())}
