from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, ApiSettings, User
from auth_utils import current_user

router = APIRouter(prefix="/settings", tags=["settings"])

FIELDS = ["groq_api_key", "openrouter_api_key", "xai_api_key", "judge0_api_key"]


def _mask(v: str | None) -> str:
    if not v:
        return ""
    return v[:4] + "***" + v[-4:] if len(v) > 10 else "***"


@router.get("/keys")
async def get_keys(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s = (await db.execute(select(ApiSettings).where(ApiSettings.user_id == user.id))).scalar_one_or_none()
    return {f: _mask(getattr(s, f, None) if s else None) for f in FIELDS}


@router.post("/keys")
async def save_keys(body: dict, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s = (await db.execute(select(ApiSettings).where(ApiSettings.user_id == user.id))).scalar_one_or_none()
    if not s:
        s = ApiSettings(user_id=user.id)
        db.add(s)
    for f in FIELDS:
        val = body.get(f, "")
        if val and "***" not in val:
            setattr(s, f, val.strip())
    await db.commit()
    return {"ok": True}
