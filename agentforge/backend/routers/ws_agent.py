import json, logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select
from database import SessionLocal, Session, Message, User, ApiSettings
from auth_utils import decode_token
from services.agent_loop import run_agent_loop

router = APIRouter()
log = logging.getLogger(__name__)


@router.websocket("/agent/{session_id}")
async def agent_ws(websocket: WebSocket, session_id: str, token: str = Query(...)):
    await websocket.accept()
    try:
        user_id = decode_token(token)
    except Exception:
        await websocket.send_json({"type": "error", "message": "Unauthorized"})
        await websocket.close()
        return

    try:
        async with SessionLocal() as db:
            session = (await db.execute(
                select(Session).where(Session.id == session_id, Session.user_id == user_id)
            )).scalar_one_or_none()
            if not session:
                await websocket.send_json({"type": "error", "message": "Session not found"})
                await websocket.close()
                return

            user     = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
            settings = (await db.execute(select(ApiSettings).where(ApiSettings.user_id == user_id))).scalar_one_or_none()

            raw  = await websocket.receive_text()
            data = json.loads(raw)
            if data.get("type") != "message":
                await websocket.send_json({"type": "error", "message": "Expected {type: 'message'}"})
                return

            content = data.get("content", "").strip()
            model   = data.get("model", session.model)
            repo_id = data.get("repo_id") or session.repo_id

            if not content:
                return

            # Persist user message
            user_msg = Message(session_id=session_id, role="user", content=content)
            db.add(user_msg)
            session.model   = model
            session.repo_id = repo_id
            session.status  = "running"
            await db.commit()

            await run_agent_loop(
                websocket=websocket,
                db=db,
                session=session,
                user=user,
                api_settings=settings,
                model=model,
            )

    except WebSocketDisconnect:
        log.info(f"WS disconnected: {session_id}")
    except Exception as e:
        log.exception(f"WS error in {session_id}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
