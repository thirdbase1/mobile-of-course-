"""
The core agent loop.

Architecture:
1. Build conversation history from DB
2. Call AI model with tool definitions
3. Stream tokens to browser as they arrive
4. On tool_call: execute tool, stream result, continue loop
5. Persist every assistant message and tool call to DB
6. Stop when model returns no tool calls (task done) or max iterations reached

Long-term operation:
- Summarises history when approaching context limit
- Saves scratchpad (plan) to session between turns
- Can be resumed if connection drops
"""
import json, os, uuid, logging, asyncio
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import Session, Message, User, ApiSettings
from services.tools import TOOL_DEFINITIONS, execute_tool

log = logging.getLogger(__name__)

MAX_ITERATIONS = 20      # safety cap per user message
MAX_HISTORY_MSGS = 40    # messages kept before summarisation kicks in

SYSTEM_PROMPT = """You are AgentForge, an expert AI software engineer with full tool access.

You help users build, fix, and improve software by:
- Writing and executing code (Python, JavaScript, Bash, and more)
- Reading and editing files in GitHub repositories
- Running git operations (commit, push, create PRs) via the GitHub API
- Searching the web for documentation and solutions
- Planning multi-step tasks and executing them step by step

BEHAVIOUR:
- Be proactive. Don't ask unnecessary clarifying questions — start working.
- After each tool call, examine the output carefully and decide the next step.
- If code has errors, fix them and re-run. Don't give up after one attempt.
- For multi-step tasks, think out loud briefly, then act.
- When the task is complete, summarise what you did clearly.

TOOL USE:
- Prefer execute_code for testing logic quickly.
- Use github_* tools to read/write actual repo files.
- Use web_search when you need current documentation or library info.
- Always verify your work — run the code, check the output.
"""

async def run_agent_loop(
    websocket:    WebSocket,
    db:           AsyncSession,
    session:      Session,
    user:         User,
    api_settings: ApiSettings | None,
    model:        str,
    user_message: str,
):
    # Resolve API keys (user settings override env vars)
    def key(attr: str, env: str) -> str | None:
        v = getattr(api_settings, attr, None) if api_settings else None
        return v or os.getenv(env)

    groq_key       = key("groq_api_key",       "GROQ_API_KEY")
    openrouter_key = key("openrouter_api_key",  "OPENROUTER_API_KEY")
    xai_key        = key("xai_api_key",         "XAI_API_KEY")
    judge0_key     = key("judge0_api_key",      "JUDGE0_API_KEY")

    # Build history from DB
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session.id)
        .order_by(Message.created_at)
    )
    history = list(result.scalars().all())

    # Build OpenAI-format messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if session.scratchpad:
        messages.append({
            "role": "system",
            "content": f"[Session scratchpad / plan so far]\n{session.scratchpad}"
        })

    # Add history (summarise if too long)
    recent = history[-MAX_HISTORY_MSGS:]
    for m in recent:
        if m.role == "user":
            messages.append({"role": "user", "content": m.content or ""})
        elif m.role == "assistant":
            msg = {"role": "assistant", "content": m.content or ""}
            messages.append(msg)
        elif m.role == "tool":
            # Reconstruct tool call + result pair
            messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id": m.id[:9],
                    "type": "function",
                    "function": {
                        "name": m.tool_name or "unknown",
                        "arguments": json.dumps(m.tool_input or {}),
                    }
                }]
            })
            messages.append({
                "role": "tool",
                "tool_call_id": m.id[:9],
                "content": str(m.tool_output or ""),
            })

    # The current user message is already in DB — it's the last entry in recent
    # (we saved it before calling this function)

    # Context for tools
    tool_context = {
        "user": user,
        "session": session,
        "db": db,
        "judge0_key": judge0_key,
        "github_token": user.github_token,
    }

    iteration = 0
    while iteration < MAX_ITERATIONS:
        iteration += 1

        # Call the AI model
        assistant_id = str(uuid.uuid4())
        await websocket.send_json({"type": "message_start", "id": assistant_id})

        full_content  = ""
        tool_calls_raw = []

        try:
            async for event in stream_model(
                model=model,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                groq_key=groq_key,
                openrouter_key=openrouter_key,
                xai_key=xai_key,
            ):
                if event["type"] == "token":
                    full_content += event["content"]
                    await websocket.send_json({"type": "token", "content": event["content"]})
                elif event["type"] == "tool_calls":
                    tool_calls_raw = event["tool_calls"]
                elif event["type"] == "error":
                    await websocket.send_json({"type": "error", "message": event["message"]})
                    return

        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Model error: {e}"})
            log.exception("stream_model error")
            return

        # Persist assistant message
        assistant_db = Message(
            id         = assistant_id,
            session_id = session.id,
            role       = "assistant",
            content    = full_content or None,
        )
        db.add(assistant_db)
        await db.commit()

        # Add to message history for next iteration
        asst_msg: dict = {"role": "assistant", "content": full_content or None}
        if tool_calls_raw:
            asst_msg["tool_calls"] = tool_calls_raw
        messages.append(asst_msg)

        # If no tool calls, agent is done
        if not tool_calls_raw:
            await websocket.send_json({"type": "done"})
            # Update session status
            session.status = "idle"
            await db.commit()
            return

        # Execute each tool call
        for tc in tool_calls_raw:
            fn_name = tc["function"]["name"]
            try:
                fn_args = json.loads(tc["function"]["arguments"])
            except Exception:
                fn_args = {}
            tc_id = tc.get("id", str(uuid.uuid4()))

            # Stream tool call to browser
            tool_msg_id = str(uuid.uuid4())
            await websocket.send_json({
                "type":      "tool_call",
                "id":        tool_msg_id,
                "tool_name": fn_name,
                "tool_input": fn_args,
            })

            # Execute
            try:
                output = await execute_tool(fn_name, fn_args, tool_context)
            except Exception as e:
                output = f"Tool error: {e}"
                log.exception(f"Tool {fn_name} failed")

            output_str = output if isinstance(output, str) else json.dumps(output)

            # Stream result
            await websocket.send_json({
                "type":   "tool_result",
                "id":     tool_msg_id,
                "output": output_str[:4000],  # cap display length
            })

            # Persist tool call + result
            tool_db = Message(
                id         = tool_msg_id,
                session_id = session.id,
                role       = "tool",
                tool_name  = fn_name,
                tool_input = fn_args,
                tool_output = output_str[:8000],
            )
            db.add(tool_db)
            await db.commit()

            # Add to messages for next model call
            messages.append({
                "role":         "tool",
                "tool_call_id": tc_id,
                "content":      output_str[:8000],
            })

    # Exceeded max iterations
    await websocket.send_json({
        "type": "error",
        "message": f"Reached maximum iterations ({MAX_ITERATIONS}). Task may be too complex — try breaking it into smaller steps."
    })


async def stream_model(model: str, messages: list, tools: list,
                        groq_key, openrouter_key, xai_key):
    """Unified streaming interface for all model providers."""
    import httpx

    provider, model_id = (model.split("/", 1) + [""])[:2]

    if provider == "groq":
        if not groq_key:
            yield {"type": "error", "message": "Groq API key not configured. Add it in Settings."}
            return
        url     = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
        model_name = {
            "llama-3.3-70b": "llama-3.3-70b-versatile",
            "mixtral-8x7b":  "mixtral-8x7b-32768",
        }.get(model_id, model_id)

    elif provider == "openrouter":
        if not openrouter_key:
            yield {"type": "error", "message": "OpenRouter API key not configured. Add it in Settings."}
            return
        url     = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "HTTP-Referer":  "https://agentforge.app",
            "Content-Type":  "application/json",
        }
        model_name = {
            "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
            "gpt-4o":            "openai/gpt-4o",
        }.get(model_id, f"{provider}/{model_id}")

    elif provider == "xai":
        if not xai_key:
            yield {"type": "error", "message": "xAI API key not configured. Add it in Settings."}
            return
        url     = "https://api.x.ai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {xai_key}", "Content-Type": "application/json"}
        model_name = {"grok-2": "grok-2-latest"}.get(model_id, model_id)

    else:
        yield {"type": "error", "message": f"Unknown model provider: {provider}"}
        return

    payload = {
        "model":    model_name,
        "messages": messages,
        "tools":    tools,
        "stream":   True,
        "max_tokens": 4096,
    }

    tool_calls_accumulator: dict[int, dict] = {}

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                yield {"type": "error", "message": f"API error {resp.status_code}: {body.decode()[:500]}"}
                return

            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = line[6:]
                if chunk == "[DONE]":
                    break
                try:
                    delta_data = json.loads(chunk)
                except Exception:
                    continue

                choice = delta_data.get("choices", [{}])[0]
                delta  = choice.get("delta", {})

                # Text token
                if delta.get("content"):
                    yield {"type": "token", "content": delta["content"]}

                # Tool call deltas (may be streamed in fragments)
                for tc in delta.get("tool_calls", []):
                    idx = tc.get("index", 0)
                    if idx not in tool_calls_accumulator:
                        tool_calls_accumulator[idx] = {
                            "id": tc.get("id", ""),
                            "type": "function",
                            "function": {"name": "", "arguments": ""},
                        }
                    if tc.get("id"):
                        tool_calls_accumulator[idx]["id"] = tc["id"]
                    fn = tc.get("function", {})
                    if fn.get("name"):
                        tool_calls_accumulator[idx]["function"]["name"] += fn["name"]
                    if fn.get("arguments"):
                        tool_calls_accumulator[idx]["function"]["arguments"] += fn["arguments"]

    if tool_calls_accumulator:
        yield {"type": "tool_calls", "tool_calls": list(tool_calls_accumulator.values())}
