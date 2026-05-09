"""
GitCode Agent Engine — specialized multi-agent orchestration and global approval systems.
"""
import json, os, uuid, logging, asyncio
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import Session, Message, User, ApiSettings, Repo, Permission
from services.tools import TOOL_DEFINITIONS, execute_tool
from services.workspace import clone_repo_to_workspace, init_workspace, get_workspace_path

log = logging.getLogger(__name__)

# Specialized Agent Profiles
AGENT_PROFILES = {
    "planner": {"name": "Planner", "color": "#A855F7", "role": "System Architecture & Task Decomposition", "prompt": "You are the Lead Planner..."},
    "coder": {"name": "Coder", "color": "#3B82F6", "role": "Feature Implementation & Refactoring", "prompt": "You are the Senior Coder..."},
    "researcher": {"name": "Researcher", "color": "#10B981", "role": "Documentation & API Analysis", "prompt": "You are the Research Agent..."},
    "reviewer": {"name": "Reviewer", "color": "#F59E0B", "role": "Code Review & Security Audit", "prompt": "You are the Review Agent..."},
    "devops": {"name": "DevOps", "color": "#EF4444", "role": "CI/CD & Deployment", "prompt": "You are the DevOps Agent..."},
    "debugger": {"name": "Debugger", "color": "#F43F5E", "role": "Error Reproduction & Log Analysis", "prompt": "You are the Debug Agent..."},
    "security": {"name": "Security", "color": "#06B6D4", "role": "Vulnerability Assessment", "prompt": "You are the Security Agent..."},
    "architect": {"name": "Architect", "color": "#14B8A6", "role": "High-level System Design", "prompt": "You are the Lead Architect..."}
}

DANGEROUS_TOOLS = [
    "github_commit_and_push", "github_create_pr", "github_create_repository",
    "delete_file", "run_bash", "run_bash_parallel"
]

# Global state to manage execution pauses across the entire system
execution_gates = {}

PROVIDERS = {
    "groq": {
        "url":     "https://api.groq.com/openai/v1/chat/completions",
        "models":  {
            "llama-3.3-70b": "llama-3.3-70b-versatile",
            "llama-3.1-70b": "llama-3.1-70b-versatile",
            "llama-3.1-8b":  "llama-3.1-8b-instant",
            "mixtral-8x7b":  "mixtral-8x7b-32768",
            "deepseek-r1":   "deepseek-r1-distill-llama-70b",
            "qwen-2.5-32b":  "qwen-2.5-32b",
            "gpt-oss-120b":  "deepseek-r1-distill-llama-70b",
            "gpt-oss-20b":   "llama-3.1-8b",
            "qwen-3-32b":    "qwen-2.5-32b",
            "llama-4-scout": "llama-3.3-70b-versatile",
            "compound-mini": "groq-compound-mini",
            "compound":      "groq-compound",
        },
        "parallel_tool_calls": False,
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
            "grok-3": "grok-3", "grok-2": "grok-2-latest", "grok-latest": "grok-latest",
        },
        "parallel_tool_calls": True,
    },
}

def _resolve_model(model_str: str):
    parts = model_str.split("/", 1)
    provider = parts[0] if len(parts) > 1 else "groq"
    model_id = parts[1] if len(parts) > 1 else parts[0]
    cfg = PROVIDERS.get(provider, PROVIDERS["groq"])
    api_name = cfg["models"].get(model_id, model_id)
    return provider, api_name, cfg

def _get_api_key(provider: str, api_settings) -> str | None:
    key_map = {"groq": ("groq_api_key", "GROQ_API_KEY"), "openrouter": ("openrouter_api_key", "OPENROUTER_API_KEY"), "xai": ("xai_api_key", "XAI_API_KEY")}
    attr, env = key_map.get(provider, ("groq_api_key", "GROQ_API_KEY"))
    return (getattr(api_settings, attr, None) if api_settings else None) or os.getenv(env)

async def run_agent_loop(websocket: WebSocket, db: AsyncSession, session: Session, user: User, api_settings: ApiSettings | None, model: str, role: str = "coder"):
    if session.id not in execution_gates:
        execution_gates[session.id] = asyncio.Event()
        execution_gates[session.id].set()

    profile = AGENT_PROFILES.get(role, AGENT_PROFILES["coder"])
    provider, api_model, cfg = _resolve_model(model)
    api_key = _get_api_key(provider, api_settings)
    if not api_key:
        await websocket.send_json({"type": "error", "message": f"No API key for {provider}."}); return

    await init_workspace(session.id)
    tool_ctx = {"github_token": user.github_token, "session_id": session.id, "db": db, "user": user, "websocket": websocket, "agent_role": role}

    repo_info = ""
    if session.repo_id:
        repo = (await db.execute(select(Repo).where(Repo.id == session.repo_id))).scalar_one_or_none()
        if repo:
            ok, msg = await clone_repo_to_workspace(session.id, repo.full_name, user.github_token, repo.default_branch, websocket=websocket)
            if not ok: await websocket.send_json({"type": "error", "message": f"Failed workspace: {msg}"}); return
            repo_info = f"\n## Active Repository\nRepo: {repo.full_name}\n"

    system_prompt = f"""You are the {profile['name']} Agent ({profile['role']}). {profile['prompt']}

## HYPER-PERFORMANCE DIRECTIVES
1. YOU ARE AN EXPERT ENGINEER. Use 'write_files' for ALL batch file creations or modifications. Never use 'write_file' sequentially if you can use 'write_files' once.
2. Use 'run_bash_parallel' for running tests, installing dependencies, and building simultaneously.
3. Plan 10-15 steps ahead in your <thought> block. Aim for x300 speed increase by maximizing parallel tool usage.
4. If a task requires 100 files, write them all in ONE 'write_files' call if possible.

## SECURITY & APPROVAL
- Tools {DANGEROUS_TOOLS} REQUIRE manual human approval. The system will pause automatically.

FORMAT:
<thought>
Extreme Detail Plan
</thought>
[Tool Calls]
"""

    hist = (await db.execute(select(Message).where(Message.session_id == session.id).order_by(Message.created_at))).scalars().all()
    messages = [{"role": "system", "content": system_prompt + repo_info}]
    for m in hist:
        if m.role == "user": messages.append({"role": "user", "content": m.content})
        elif m.role == "assistant": messages.append({"role": "assistant", "content": m.content, "agent_role": m.agent_role})
        elif m.role == "tool_call":
            messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": m.tool_call_id, "type": "function", "function": {"name": m.tool_name, "arguments": json.dumps(m.tool_input)}}]})
        elif m.role == "tool_result":
            messages.append({"role": "tool", "tool_call_id": m.tool_call_id, "content": m.tool_output})

    iteration = 0
    while iteration < 50:
        # Check if globally paused
        if not execution_gates[session.id].is_set():
            await websocket.send_json({"type": "status", "message": "Awaiting Security Clearance..."})
            await execution_gates[session.id].wait()

        iteration += 1
        asst_id = str(uuid.uuid4())
        full_content, tool_calls = "", []
        await websocket.send_json({"type": "message_start", "id": asst_id, "role": role})

        async for event in _stream_model(cfg["url"], api_key, provider, api_model, messages, TOOL_DEFINITIONS, cfg.get("parallel_tool_calls", False)):
            if event["type"] == "reasoning": await websocket.send_json({"type": "reasoning", "id": asst_id, "content": event["content"]})
            elif event["type"] == "token":
                full_content += event["content"]
                await websocket.send_json({"type": "token", "id": asst_id, "content": event["content"]})
            elif event["type"] == "tool_calls": tool_calls = event["tool_calls"]
            elif event["type"] == "error":
                await websocket.send_json({"type": "error", "message": event["message"]}); return

        db.add(Message(id=asst_id, session_id=session.id, role="assistant", agent_role=role, content=full_content or None))
        await db.commit()
        messages.append({"role": "assistant", "content": full_content or None, "tool_calls": tool_calls or None})
        if not tool_calls: await websocket.send_json({"type": "done"}); return

        async def execute_and_log(tc):
            fn_name, fn_args, tc_id = tc["function"]["name"], json.loads(tc["function"]["arguments"] or "{}"), tc.get("id", str(uuid.uuid4()))

            # ─── Approval & Global Pause ──────────────────────────────────────
            if fn_name in DANGEROUS_TOOLS:
                # Check for "Always Allow" in DB
                perm = (await db.execute(select(Permission).where(Permission.user_id == user.id, Permission.tool_name == fn_name, Permission.allowed == True))).scalar_one_or_none()
                if not perm:
                    execution_gates[session.id].clear() # Globally pause session
                    await websocket.send_json({"type": "approval_required", "tool": fn_name, "args": fn_args, "tc_id": tc_id})
                    await execution_gates[session.id].wait() # Wait for human response

            call_id = str(uuid.uuid4())
            await websocket.send_json({"type": "tool_call", "id": call_id, "tc_id": tc_id, "tool_name": fn_name, "tool_input": fn_args, "agent_role": role})
            output = await execute_tool(fn_name, fn_args, tool_ctx)
            await websocket.send_json({"type": "tool_result", "id": call_id, "tc_id": tc_id, "output": output[:32000]})
            return tc_id, fn_name, fn_args, output

        results = await asyncio.gather(*(execute_and_log(tc) for tc in tool_calls))
        for tc_id, fn_name, fn_args, output in results:
            db.add(Message(id=str(uuid.uuid4()), session_id=session.id, role="tool_call", tool_name=fn_name, tool_call_id=tc_id, tool_input=fn_args, agent_role=role))
            db.add(Message(session_id=session.id, role="tool_result", tool_call_id=tc_id, tool_output=output[:16000]))
            messages.append({"role": "tool", "tool_call_id": tc_id, "content": output[:10000]})
        await db.commit()

async def _stream_model(url, api_key, provider, model, messages, tools, parallel):
    import httpx
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if provider == "openrouter": headers["HTTP-Referer"], headers["X-Title"] = "https://agentforge-frontend-ambi.onrender.com", "AgentForge"
    payload = {"model": model, "messages": messages, "tools": tools, "stream": True, "max_tokens": 16384}
    if parallel: payload["parallel_tool_calls"] = True
    acc = {}
    async with httpx.AsyncClient(timeout=180) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200: yield {"type": "error", "message": f"API error {resp.status_code}"}; return
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
