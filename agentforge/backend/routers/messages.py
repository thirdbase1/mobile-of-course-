from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, Session, Message
from auth_utils import current_user
from database import User

router = APIRouter()


def _out(m: Message):
    return {
        "id":           m.id,
        "role":         m.role,
        "content":      m.content,
        "tool_name":    m.tool_name,
        "tool_call_id": m.tool_call_id,
        "tool_input":   m.tool_input,
        "tool_output":  m.tool_output,
        "created_at":   m.created_at,
    }


@router.get("/{sid}/messages")
async def get_messages(sid: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s = (await db.execute(select(Session).where(Session.id == sid, Session.user_id == user.id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")
    msgs = (await db.execute(
        select(Message).where(Message.session_id == sid).order_by(Message.created_at)
    )).scalars().all()
    return [_out(m) for m in msgs]
