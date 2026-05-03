import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db, Repo, User
from auth_utils import current_user

router = APIRouter()

class ImportRepo(BaseModel):
    full_name: str
    default_branch: str = "main"

def repo_out(r: Repo):
    return {
        "id": r.id,
        "full_name": r.full_name,
        "name": r.name,
        "private": r.private,
        "default_branch": r.default_branch,
        "language": r.language,
        "imported_at": r.imported_at,
    }

@router.get("")
async def list_repos(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Repo).where(Repo.user_id == user.id).order_by(Repo.imported_at.desc()))
    return [repo_out(r) for r in result.scalars().all()]

@router.get("/github")
async def list_github_repos(user: User = Depends(current_user)):
    if not user.github_token:
        raise HTTPException(401, "No GitHub token")
    repos = []
    page  = 1
    async with httpx.AsyncClient() as client:
        while True:
            r = await client.get(
                "https://api.github.com/user/repos",
                params={"per_page": 100, "page": page, "sort": "updated", "affiliation": "owner"},
                headers={"Authorization": f"Bearer {user.github_token}", "Accept": "application/vnd.github+json"},
                timeout=15,
            )
            data = r.json()
            if not data or not isinstance(data, list): break
            repos.extend(data)
            if len(data) < 100: break
            page += 1
    return [
        {
            "full_name": r["full_name"],
            "name": r["name"],
            "private": r["private"],
            "default_branch": r.get("default_branch", "main"),
            "language": r.get("language"),
        }
        for r in repos
    ]

@router.post("/import")
async def import_repo(
    body: ImportRepo,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check not already imported
    existing = await db.execute(
        select(Repo).where(Repo.user_id == user.id, Repo.full_name == body.full_name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Repo already imported")

    # Verify access via GitHub API
    if user.github_token:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://api.github.com/repos/{body.full_name}",
                headers={"Authorization": f"Bearer {user.github_token}", "Accept": "application/vnd.github+json"},
                timeout=10,
            )
        if r.status_code != 200:
            raise HTTPException(404, "Repo not found or no access")
        gh_data = r.json()
        name     = gh_data["name"]
        private  = gh_data["private"]
        language = gh_data.get("language")
        branch   = gh_data.get("default_branch", body.default_branch)
    else:
        name     = body.full_name.split("/")[-1]
        private  = False
        language = None
        branch   = body.default_branch

    repo = Repo(
        user_id        = user.id,
        full_name      = body.full_name,
        name           = name,
        private        = private,
        language       = language,
        default_branch = branch,
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    return repo_out(repo)

@router.delete("/{repo_id}")
async def delete_repo(
    repo_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Repo).where(Repo.id == repo_id, Repo.user_id == user.id))
    r = result.scalar_one_or_none()
    if not r: raise HTTPException(404, "Repo not found")
    await db.delete(r)
    await db.commit()
    return {"ok": True}

@router.get("/{repo_id}/files")
async def list_files(
    repo_id: str,
    path: str = "",
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Repo).where(Repo.id == repo_id, Repo.user_id == user.id))
    repo = result.scalar_one_or_none()
    if not repo: raise HTTPException(404)

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://api.github.com/repos/{repo.full_name}/contents/{path}",
            headers={"Authorization": f"Bearer {user.github_token}", "Accept": "application/vnd.github+json"},
            timeout=10,
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, "GitHub API error")
    return r.json()

@router.get("/{repo_id}/file")
async def get_file(
    repo_id: str,
    path: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Repo).where(Repo.id == repo_id, Repo.user_id == user.id))
    repo = result.scalar_one_or_none()
    if not repo: raise HTTPException(404)

    import base64
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://api.github.com/repos/{repo.full_name}/contents/{path}",
            headers={"Authorization": f"Bearer {user.github_token}", "Accept": "application/vnd.github+json"},
            timeout=10,
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, "File not found")
    data = r.json()
    content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    return {"path": path, "content": content, "sha": data.get("sha")}
