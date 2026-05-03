from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from database import get_db, Session, Message
from auth_utils import current_user
from database import User

router = APIRouter()

class CreateSession(BaseModel):
    title: str = "New session"
    model: str = "groq/llama-3.3-70b"
    repo_id: str | None = None

def session_out(s: Session, msg_count: int = 0):
    return {
        "id": s.id,
        "title": s.title,
        "model": s.model,
        "repo_id": s.repo_id,
        "status": s.status,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "message_count": msg_count,
    }

@router.get("")
async def list_sessions(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user.id)
        .order_by(Session.updated_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    out = []
    for s in sessions:
        cnt = await db.execute(select(func.count(Message.id)).where(Message.session_id == s.id))
        out.append(session_out(s, cnt.scalar() or 0))
    return out

@router.post("")
async def create_session(
    body: CreateSession,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    s = Session(user_id=user.id, title=body.title, model=body.model, repo_id=body.repo_id)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return session_out(s)

@router.get("/{session_id}")
async def get_session(
    session_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == user.id))
    s = result.scalar_one_or_none()
    if not s: raise HTTPException(404, "Session not found")
    cnt = await db.execute(select(func.count(Message.id)).where(Message.session_id == s.id))
    return session_out(s, cnt.scalar() or 0)

@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == user.id))
    s = result.scalar_one_or_none()
    if not s: raise HTTPException(404, "Session not found")
    await db.delete(s)
    await db.commit()
    return {"ok": True}
