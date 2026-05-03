import os, httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, User
from auth_utils import create_token, current_user

router = APIRouter()

GH_CLIENT_ID     = os.getenv("GITHUB_CLIENT_ID", "")
GH_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL     = os.getenv("FRONTEND_URL", "http://localhost:3000")

@router.get("/github")
async def github_login():
    if not GH_CLIENT_ID:
        raise HTTPException(400, "GITHUB_CLIENT_ID not configured. Set it in Settings.")
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GH_CLIENT_ID}"
        f"&scope=repo,read:user,user:email"
        f"&allow_signup=true"
    )
    return RedirectResponse(url)

@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://github.com/login/oauth/access_token",
            json={"client_id": GH_CLIENT_ID, "client_secret": GH_CLIENT_SECRET, "code": code},
            headers={"Accept": "application/json"},
            timeout=15,
        )
    data = r.json()
    access_token = data.get("access_token")
    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error=github_denied")

    # Get GitHub user info
    async with httpx.AsyncClient() as client:
        gu = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            timeout=10,
        )
    gh_user = gu.json()
    github_id = gh_user["id"]

    # Upsert user
    result = await db.execute(select(User).where(User.github_id == github_id))
    user = result.scalar_one_or_none()
    if user:
        user.github_token = access_token
        user.login        = gh_user.get("login", "")
        user.name         = gh_user.get("name")
        user.avatar_url   = gh_user.get("avatar_url")
    else:
        user = User(
            github_id    = github_id,
            login        = gh_user.get("login", ""),
            name         = gh_user.get("name"),
            avatar_url   = gh_user.get("avatar_url"),
            github_token = access_token,
        )
        db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id)
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={token}")

@router.get("/me")
async def me(user: User = Depends(current_user)):
    return {
        "id": user.id,
        "login": user.login,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
    }
