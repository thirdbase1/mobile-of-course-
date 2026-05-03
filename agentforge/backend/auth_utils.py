import os, jwt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, User

SECRET  = os.getenv("SECRET_KEY", "change-me-in-production-please")
ALGO    = "HS256"
EXPIRY  = timedelta(days=30)

bearer = HTTPBearer(auto_error=False)

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + EXPIRY,
    }
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def decode_token(token: str) -> str:
    try:
        data = jwt.decode(token, SECRET, algorithms=[ALGO])
        return data["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_token(creds.credentials)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
