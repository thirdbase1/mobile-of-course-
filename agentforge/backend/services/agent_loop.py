"""
Agent loop — Hyper-Parallel Autonomous Engine.
"""
import json, os, uuid, logging, asyncio
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import Session, Message, User, ApiSettings, Repo
from services.tools import TOOL_DEFINITIONS, execute_tool
from services.workspace import clone_repo_to_workspace, init_workspace, get_workspace_path

log = logging.getLogger(__name__)

MAX_ITER   = 50
MAX_HIST   = 150

SYSTEM_PROMPT = """\
You are Agent Forge, a high-performance autonomous software engineering engine.

Your purpose is to build complex systems at extreme speed. You have been upgraded with HYPER-PARALLEL capabilities.

---

## HYPER-PARALLEL EXECUTION RULES

1. BATCH OPERATIONS
- To write multiple files, you MUST use the `write_files` power tool. Do not call `write_file` sequentially.
- To run multiple commands (e.g., install + build + test), you MUST use `run_bash_parallel`.
- You can generate hundreds of files in a single turn. Be aggressive.

2. ASYNCHRONOUS ENGINE
- You operate in a high-capacity sandbox.
- You are not limited by sequential thinking. Plan 10 steps ahead and execute them all in one batch call if possible.

---

## CORE PRINCIPLES

1. SANDBOX-FIRST
Work in /tmp/agentforge/{session_id}.

2. TRANSPARENCY
Emit raw terminal logs. No generic descriptions.

3. REASONING
Always output a <thought> block before taking action.

---

## RESPONSE FORMAT

1. <thought>
Detailed parallel execution plan.
</thought>

2. TOOL CALLS
Invoke multiple tools simultaneously.
"""

PROVIDERS = {
    "groq": {
        "url":     "https://api.groq.com/openai/v1/chat/completions",
        "models":  {
            "llama-3.3-70b":  "llama-3.3-70b-versatile",
            "llama-3.1-70b":  "llama-3.1-70b-versatile",
            "llama-3.1-8b":   "llama-3.1-8b-instant",
            "mixtral-8x7b":   "mixtral-8x7b-32768",
            "deepseek-r1":    "deepseek-r1-distill-llama-70b",
            "qwen-2.5-32b":   "qwen-2.5-32b",
            "qwen-3-32b":     "qwen-2.5-32b",
            "gpt-oss-120b":   "deepseek-r1-distill-llama-70b",
            "gpt-oss-20b":    "llama-3.1-70b-versatile",
            "llama-4-scout":  "llama-3.3-70b-versatile",
            "compound-mini":  "groq-compound-mini",
            "compound":       "groq-compound",
        },
        "parallel_tool_calls": False, # Groq limitation
    },
    "openrouter": {
        "url":    "https://openrouter.ai/api/v1/chat/completions",
        "models": {
            "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
            "gpt-4o":            "openai/gpt-4o",
            "deepseek-r1":       "deepseek/deepseek-r1",
            "grok-3":            "x-ai/grok-3",
            "nemotron-3-super":  "nvidia/nemotron-3-super-120b-a12b",
            "owl-alpha":         "openrouter/owl-alpha",
            "qianfan-ocr":       "baidu/qianfan-ocr-fast",
            "laguna-m1":         "poolside/laguna-m.1",
            "laguna-xs2":        "poolside/laguna-xs.2",
            "cobuddy":           "baidu/cobuddy",
            "qwen3-coder":       "qwen/qwen-2.5-coder-32b-instruct",
            "minimax-m2.5":      "minimax/minimax-01",
            "glm-4.5-air":       "z-ai/glm-4.5-air",
        },
        "parallel_tool_calls": True,
    },
    "xai": {
        "url":    "https://api.x.ai/v1/chat/completions",
        "models": {
            "grok-3":      "grok-3",
            "grok-2":      "grok-2-latest",
            "grok-latest": "grok-latest",
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

    await init_workspace(session.id)
    tool_ctx = {"github_token": user.github_token, "session_id": session.id, "db": db, "user": user, "websocket": websocket}

    repo_info = ""
    if session.repo_id:
        repo = (await db.execute(select(Repo).where(Repo.id == session.repo_id))).scalar_one_or_none()
        if repo:
            ok, msg = await clone_repo_to_workspace(session.id, repo.full_name, user.github_token, repo.default_branch, websocket=websocket)
            if not ok:
                await websocket.send_json({"type": "error", "message": f"Failed to initialize workspace: {msg}"})
                return
            repo_info = f"\n## Active Repository\nRepo: {repo.full_name}\nDefault branch: {repo.default_branch}\n"
            tool_ctx["default_repo"]   = repo.full_name
            tool_ctx["default_branch"] = repo.default_branch

    hist = (await db.execute(select(Message).where(Message.session_id == session.id).order_by(Message.created_at))).scalars().all()
    messages = [{"role": "system", "content": SYSTEM_PROMPT.replace("{session_id}", session.id) + repo_info}]
    for m in hist:
        if m.role == "user": messages.append({"role": "user", "content": m.content})
        elif m.role == "assistant" and m.content: messages.append({"role": "assistant", "content": m.content})
        elif m.role == "tool_call": messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": m.tool_call_id, "type": "function", "function": {"name": m.tool_name, "arguments": json.dumps(m.tool_input)}}]})
        elif m.role == "tool_result": messages.append({"role": "tool", "tool_call_id": m.tool_call_id, "content": m.tool_output})

    if len(messages) > MAX_HIST + 1: messages = [messages[0]] + messages[-(MAX_HIST):]

    iteration = 0
    while iteration < MAX_ITER:
        iteration += 1
        asst_id = str(uuid.uuid4())
        full_content, tool_calls = "", []
        await websocket.send_json({"type": "message_start", "id": asst_id})
        async for event in _stream_model(cfg["url"], api_key, provider, api_model, messages, TOOL_DEFINITIONS, cfg.get("parallel_tool_calls", False)):
            if event["type"] == "reasoning": await websocket.send_json({"type": "reasoning", "id": asst_id, "content": event["content"]})
            elif event["type"] == "token":
                full_content += event["content"]
                await websocket.send_json({"type": "token", "id": asst_id, "content": event["content"]})
            elif event["type"] == "tool_calls": tool_calls = event["tool_calls"]
            elif event["type"] == "error":
                await websocket.send_json({"type": "error", "message": event["message"]})
                return
        db.add(Message(id=asst_id, session_id=session.id, role="assistant", content=full_content or None))
        await db.commit()
        messages.append({"role": "assistant", "content": full_content or None, "tool_calls": tool_calls or None})
        if not tool_calls:
            await websocket.send_json({"type": "done"})
            return

        async def execute_and_log(tc):
            fn_name, fn_args, tc_id = tc["function"]["name"], json.loads(tc["function"]["arguments"] or "{}"), tc.get("id", str(uuid.uuid4()))
            call_id = str(uuid.uuid4())
            await websocket.send_json({"type": "tool_call", "id": call_id, "tc_id": tc_id, "tool_name": fn_name, "tool_input": fn_args})
            output = await execute_tool(fn_name, fn_args, tool_ctx)
            await websocket.send_json({"type": "tool_result", "id": call_id, "tc_id": tc_id, "output": output[:32000]}) # Larger output for power tools
            return tc_id, fn_name, fn_args, output

        results = await asyncio.gather(*(execute_and_log(tc) for tc in tool_calls))
        for tc_id, fn_name, fn_args, output in results:
            db.add(Message(id=str(uuid.uuid4()), session_id=session.id, role="tool_call", tool_name=fn_name, tool_call_id=tc_id, tool_input=fn_args))
            db.add(Message(session_id=session.id, role="tool_result", tool_call_id=tc_id, tool_output=output[:64000]))
            messages.append({"role": "tool", "tool_call_id": tc_id, "content": output[:32000]})
        await db.commit()

async def _stream_model(url, api_key, provider, model, messages, tools, parallel):
    import httpx
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if provider == "openrouter": headers["HTTP-Referer"], headers["X-Title"] = "https://agentforge-frontend-ambi.onrender.com", "AgentForge"
    payload = {"model": model, "messages": messages, "tools": tools, "stream": True, "max_tokens": 16384} # Double tokens for massive code
    if parallel: payload["parallel_tool_calls"] = True
    acc = {}
    async with httpx.AsyncClient(timeout=240) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200: yield {"type": "error", "message": f"API error {resp.status_code}: {(await resp.aread()).decode()}"}; return
            async for line in resp.aiter_lines():
                if not line.startswith("data: "): continue
                raw = line[6:].strip()
                if raw == "[DONE]": break
                try:
                    chunk = json.loads(raw); delta = chunk["choices"][0]["delta"]
                    reasoning = delta.get("reasoning_content") or delta.get("reasoning")
                    if reasoning: yield {"type": "reasoning", "content": reasoning}
                    if delta.get("content"): yield {"type": "token", "content": delta["content"]}
                    for tc in delta.get("tool_calls", []):
                        idx = tc.get("index", 0)
                        if idx not in acc: acc[idx] = {"id": "", "type": "function", "function": {"name": "", "arguments": ""}}
                        if tc.get("id"): acc[idx]["id"] = tc["id"]
                        if tc.get("function", {}).get("name"): acc[idx]["function"]["name"] += tc["function"]["name"]
                        if tc.get("function", {}).get("arguments"): acc[idx]["function"]["arguments"] += tc["function"]["arguments"]
                except: continue
    if acc: yield {"type": "tool_calls", "tool_calls": list(acc.values())}
