from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, Session, Message
from auth_utils import current_user
from database import User

router = APIRouter()

def msg_out(m: Message):
    return {
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "tool_name": m.tool_name,
        "tool_input": m.tool_input,
        "tool_output": m.tool_output,
        "created_at": m.created_at,
    }

@router.get("/{session_id}/messages")
async def get_messages(
    session_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.user_id == user.id)
    )
    s = result.scalar_one_or_none()
    if not s: raise HTTPException(404, "Session not found")

    msgs = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at)
    )
    return [msg_out(m) for m in msgs.scalars().all()]
