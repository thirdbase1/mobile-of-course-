import json, logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, Session, Message
from auth_utils import ws_user
from services.agent_loop import run_agent_loop

router = APIRouter(prefix="/ws/agent", tags=["ws"])
log = logging.getLogger(__name__)

@router.websocket("/{session_id}")
async def ws_agent_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    await websocket.accept()
    try:
        user = await ws_user(token, db)
    except Exception:
        await websocket.send_json({"type": "error", "message": "Unauthorized"})
        await websocket.close()
        return

    # Check if session exists and belongs to user
    from sqlalchemy import select
    from database import ApiSettings
    res = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == user.id))
    session = res.scalar_one_or_none()
    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    # Load API keys
    res = await db.execute(select(ApiSettings).where(ApiSettings.user_id == user.id))
    api_settings = res.scalar_one_or_none()

    try:
        # Update session status
        session.status = "running"
        await db.commit()

        # Run loop
        await run_agent_loop(websocket, db, session, user, api_settings, session.model)

    except WebSocketDisconnect:
        log.info(f"WS disconnected for session {session_id}")
    except Exception as e:
        log.exception(f"WS error for session {session_id}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except: pass
    finally:
        session.status = "idle"
        await db.commit()
