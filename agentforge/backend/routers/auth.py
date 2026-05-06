import os, httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, User
from auth_utils import create_token, current_user

router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _gh_creds():
    cid  = os.getenv("GITHUB_CLIENT_ID", "")
    sec  = os.getenv("GITHUB_CLIENT_SECRET", "")
    if not cid or not sec:
        raise HTTPException(400, "GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars.")
    return cid, sec


@router.get("/github")
async def github_login():
    cid, _ = _gh_creds()
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize"
        f"?client_id={cid}&scope=repo,read:user,user:email&allow_signup=true"
    )


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    cid, sec = _gh_creds()

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            "https://github.com/login/oauth/access_token",
            json={"client_id": cid, "client_secret": sec, "code": code},
            headers={"Accept": "application/json"},
        )
    data         = r.json()
    access_token = data.get("access_token")
    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error=github_denied")

    async with httpx.AsyncClient(timeout=10) as client:
        gu = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
    gh = gu.json()

    result = await db.execute(select(User).where(User.github_id == gh["id"]))
    user   = result.scalar_one_or_none()
    if user:
        user.github_token = access_token
        user.login        = gh.get("login", "")
        user.name         = gh.get("name")
        user.avatar_url   = gh.get("avatar_url")
    else:
        user = User(
            github_id    = gh["id"],
            login        = gh.get("login", ""),
            name         = gh.get("name"),
            avatar_url   = gh.get("avatar_url"),
            github_token = access_token,
        )
        db.add(user)
    await db.commit()
    await db.refresh(user)

    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={create_token(user.id)}")


@router.get("/me")
async def me(user: User = Depends(current_user)):
    return {
        "id":         user.id,
        "login":      user.login,
        "name":       user.name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
    }
