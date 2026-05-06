from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from database import get_db, Session, Message, Repo
from auth_utils import current_user
from database import User

router = APIRouter(prefix="/sessions", tags=["sessions"])


class CreateSession(BaseModel):
    title:   str       = "New session"
    model:   str       = "groq/llama-3.3-70b"
    repo_id: str | None = None


class PatchSession(BaseModel):
    title:   str | None = None
    model:   str | None = None
    repo_id: str | None = None


def _out(s: Session, msg_count: int = 0, repo: Repo | None = None):
    return {
        "id":            s.id,
        "title":         s.title,
        "model":         s.model,
        "repo_id":       s.repo_id,
        "repo":          {"id": repo.id, "full_name": repo.full_name, "default_branch": repo.default_branch} if repo else None,
        "status":        s.status,
        "created_at":    s.created_at,
        "updated_at":    s.updated_at,
        "message_count": msg_count,
    }


@router.get("")
async def list_sessions(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(Session).where(Session.user_id == user.id).order_by(Session.updated_at.desc()).limit(100)
    )).scalars().all()

    out = []
    for s in rows:
        cnt  = (await db.execute(select(func.count(Message.id)).where(Message.session_id == s.id))).scalar() or 0
        repo = (await db.execute(select(Repo).where(Repo.id == s.repo_id))).scalar_one_or_none() if s.repo_id else None
        out.append(_out(s, cnt, repo))
    return out


@router.post("")
async def create_session(body: CreateSession, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s = Session(user_id=user.id, title=body.title, model=body.model, repo_id=body.repo_id)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    repo = (await db.execute(select(Repo).where(Repo.id == s.repo_id))).scalar_one_or_none() if s.repo_id else None
    return _out(s, 0, repo)


@router.get("/{sid}")
async def get_session(sid: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s = (await db.execute(select(Session).where(Session.id == sid, Session.user_id == user.id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")
    cnt  = (await db.execute(select(func.count(Message.id)).where(Message.session_id == sid))).scalar() or 0
    repo = (await db.execute(select(Repo).where(Repo.id == s.repo_id))).scalar_one_or_none() if s.repo_id else None
    return _out(s, cnt, repo)


@router.patch("/{sid}")
async def patch_session(sid: str, body: PatchSession, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s = (await db.execute(select(Session).where(Session.id == sid, Session.user_id == user.id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")
    if body.title   is not None: s.title   = body.title
    if body.model   is not None: s.model   = body.model
    if body.repo_id is not None: s.repo_id = body.repo_id
    await db.commit()
    await db.refresh(s)
    repo = (await db.execute(select(Repo).where(Repo.id == s.repo_id))).scalar_one_or_none() if s.repo_id else None
    return _out(s, 0, repo)


@router.delete("/{sid}")
async def delete_session(sid: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s = (await db.execute(select(Session).where(Session.id == sid, Session.user_id == user.id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")
    await db.delete(s)
    await db.commit()
    return {"ok": True}
