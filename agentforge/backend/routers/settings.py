from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db, ApiSettings, User
from auth_utils import current_user

router = APIRouter()

FIELDS = ["groq_api_key", "openrouter_api_key", "xai_api_key", "judge0_api_key",
          "github_client_id", "github_client_secret"]

def mask(v: str | None) -> str:
    if not v: return ""
    if len(v) <= 8: return "***"
    return v[:4] + "***" + v[-4:]

@router.get("/keys")
async def get_keys(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ApiSettings).where(ApiSettings.user_id == user.id))
    s = result.scalar_one_or_none()
    out = {}
    for f in FIELDS:
        v = getattr(s, f, None) if s else None
        out[f] = mask(v)
    return out

@router.post("/keys")
async def save_keys(
    body: dict,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ApiSettings).where(ApiSettings.user_id == user.id))
    s = result.scalar_one_or_none()
    if not s:
        s = ApiSettings(user_id=user.id)
        db.add(s)

    for f in FIELDS:
        val = body.get(f, "")
        # Don't overwrite with a masked placeholder
        if val and "***" not in val:
            setattr(s, f, val)
        elif not val:
            # Explicit clear
            pass  # keep existing

    await db.commit()
    return {"ok": True}
