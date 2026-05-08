from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import httpx, os
from database import get_db, Repo, User, Session
from auth_utils import current_user
from services.workspace import get_workspace_path
from pathlib import Path

router = APIRouter(prefix="/repos", tags=["repos"])

@router.get("")
async def list_imported_repos(db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    res = await db.execute(select(Repo).where(Repo.user_id == user.id))
    return res.scalars().all()

@router.get("/github")
async def list_github_repos(user: User = Depends(current_user)):
    if not user.github_token:
        raise HTTPException(status_code=400, detail="GitHub not connected")
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.github.com/user/repos",
            params={"sort": "updated", "per_page": 100},
            headers={"Authorization": f"Bearer {user.github_token}"}
        )
    return r.json()

@router.post("/import")
async def import_repo(data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    full_name = data.get("full_name")
    ex = await db.execute(select(Repo).where(Repo.user_id == user.id, Repo.full_name == full_name))
    if ex.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Repository already imported")

    async with httpx.AsyncClient() as client:
        r = await client.get(f"https://api.github.com/repos/{full_name}", headers={"Authorization": f"Bearer {user.github_token}"})
        if r.status_code != 200: raise HTTPException(status_code=400, detail="Repo not found")
        rd = r.json()

    new_repo = Repo(
        user_id=user.id,
        full_name=full_name,
        name=rd["name"],
        private=rd.get("private", False),
        default_branch=rd.get("default_branch", "main"),
        language=rd.get("language"),
        description=rd.get("description")
    )
    db.add(new_repo)
    await db.commit()
    await db.refresh(new_repo)
    return new_repo

@router.delete("/{repo_id}")
async def delete_repo(repo_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    await db.execute(delete(Repo).where(Repo.id == repo_id, Repo.user_id == user.id))
    await db.commit()
    return {"ok": True}

@router.get("/fs/{session_id}")
async def list_workspace_files(session_id: str, path: str = "", user = Depends(current_user)):
    ws = get_workspace_path(session_id)
    target = (ws / path).resolve()
    if not str(target).startswith(str(ws.resolve())):
        raise HTTPException(403, "Access denied")

    if not target.exists():
        return []

    def get_tree(p: Path):
        nodes = []
        for item in p.iterdir():
            if item.name.startswith(".git") and item.name != ".gitignore": continue

            node = {
                "name": item.name,
                "path": str(item.relative_to(ws)),
                "type": "dir" if item.is_dir() else "file"
            }
            if item.is_dir():
                # For high-perf, we could lazy load, but for now we'll do recursive for the small sandbox
                node["children"] = get_tree(item)
            nodes.append(node)
        return nodes

    return get_tree(target)

@router.get("/fs/{session_id}/file")
async def get_workspace_file(session_id: str, path: str, user = Depends(current_user)):
    ws = get_workspace_path(session_id)
    target = (ws / path).resolve()
    if not str(target).startswith(str(ws.resolve())):
        raise HTTPException(403, "Access denied")

    if not target.is_file():
        raise HTTPException(404, "File not found")

    return {
        "content": target.read_text(errors='replace'),
        "path": path,
        "name": target.name
    }
