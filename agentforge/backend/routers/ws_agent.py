"""
WebSocket endpoint that drives the agent loop.
- Accepts a user message
- Runs the AI model with tools in a loop
- Streams tokens + tool calls back to the browser in real time
- Persists every message/tool call to the database
"""
import json, os, logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import SessionLocal, Session, Message, User, ApiSettings
from auth_utils import decode_token
from services.agent_loop import run_agent_loop

router = APIRouter()
log = logging.getLogger(__name__)

@router.websocket("/agent/{session_id}")
async def agent_ws(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
):
    await websocket.accept()

    # Auth
    try:
        user_id = decode_token(token)
    except Exception:
        await websocket.send_json({"type": "error", "message": "Unauthorized"})
        await websocket.close()
        return

    try:
        async with SessionLocal() as db:
            # Load session + user
            result = await db.execute(
                select(Session).where(Session.id == session_id, Session.user_id == user_id)
            )
            session = result.scalar_one_or_none()
            if not session:
                await websocket.send_json({"type": "error", "message": "Session not found"})
                await websocket.close()
                return

            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()

            settings_result = await db.execute(select(ApiSettings).where(ApiSettings.user_id == user_id))
            api_settings = settings_result.scalar_one_or_none()

            # Wait for first message from client
            raw = await websocket.receive_text()
            data = json.loads(raw)
            if data.get("type") != "message":
                await websocket.send_json({"type": "error", "message": "Expected message type"})
                return

            user_content = data.get("content", "").strip()
            model        = data.get("model", session.model)

            if not user_content:
                return

            # Save user message
            user_msg = Message(session_id=session_id, role="user", content=user_content)
            db.add(user_msg)
            session.model = model
            await db.commit()
            await db.refresh(user_msg)

            # Run the agent loop — streams events back over websocket
            await run_agent_loop(
                websocket    = websocket,
                db           = db,
                session      = session,
                user         = user,
                api_settings = api_settings,
                model        = model,
                user_message = user_content,
            )

    except WebSocketDisconnect:
        log.info(f"WS disconnected: {session_id}")
    except Exception as e:
        log.exception(f"WS error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
