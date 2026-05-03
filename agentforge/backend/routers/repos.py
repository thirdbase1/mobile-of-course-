import httpx, base64
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db, Repo, User
from auth_utils import current_user

router = APIRouter()


def _repo_out(r: Repo):
    return {
        "id":             r.id,
        "full_name":      r.full_name,
        "name":           r.name,
        "private":        r.private,
        "default_branch": r.default_branch,
        "language":       r.language,
        "description":    r.description,
        "imported_at":    r.imported_at,
    }


def _gh_headers(token: str):
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}


# ── list imported ─────────────────────────────────────────────────────────────

@router.get("")
async def list_repos(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Repo).where(Repo.user_id == user.id).order_by(Repo.imported_at.desc()))).scalars().all()
    return [_repo_out(r) for r in rows]


# ── list user's GitHub repos ──────────────────────────────────────────────────

@router.get("/github")
async def list_github_repos(user: User = Depends(current_user)):
    if not user.github_token:
        raise HTTPException(401, "No GitHub token")
    repos, page = [], 1
    async with httpx.AsyncClient(timeout=20) as client:
        while True:
            r = await client.get(
                "https://api.github.com/user/repos",
                params={"per_page": 100, "page": page, "sort": "updated", "affiliation": "owner"},
                headers=_gh_headers(user.github_token),
            )
            data = r.json()
            if not isinstance(data, list) or not data:
                break
            repos.extend(data)
            if len(data) < 100:
                break
            page += 1
    return [
        {
            "full_name":      r["full_name"],
            "name":           r["name"],
            "private":        r["private"],
            "default_branch": r.get("default_branch", "main"),
            "language":       r.get("language"),
            "description":    r.get("description"),
        }
        for r in repos
    ]


# ── import repo ───────────────────────────────────────────────────────────────

class ImportRepo(BaseModel):
    full_name:      str
    default_branch: str = "main"


@router.post("/import")
async def import_repo(body: ImportRepo, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(
        select(Repo).where(Repo.user_id == user.id, Repo.full_name == body.full_name)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Already imported")

    gh_data, name, private, lang, desc, branch = {}, body.full_name.split("/")[-1], False, None, None, body.default_branch

    if user.github_token:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"https://api.github.com/repos/{body.full_name}",
                headers=_gh_headers(user.github_token),
            )
        if r.status_code == 404:
            raise HTTPException(404, "Repo not found or no access")
        gh_data = r.json()
        name    = gh_data.get("name", name)
        private = gh_data.get("private", False)
        lang    = gh_data.get("language")
        desc    = gh_data.get("description")
        branch  = gh_data.get("default_branch", branch)

    repo = Repo(user_id=user.id, full_name=body.full_name, name=name,
                private=private, language=lang, description=desc, default_branch=branch)
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    return _repo_out(repo)


@router.delete("/{rid}")
async def delete_repo(rid: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(Repo).where(Repo.id == rid, Repo.user_id == user.id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404)
    await db.delete(r)
    await db.commit()
    return {"ok": True}


# ── file ops ──────────────────────────────────────────────────────────────────

@router.get("/{rid}/files")
async def list_files(rid: str, path: str = "", ref: str = "", user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    repo = (await db.execute(select(Repo).where(Repo.id == rid, Repo.user_id == user.id))).scalar_one_or_none()
    if not repo:
        raise HTTPException(404)
    branch = ref or repo.default_branch
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"https://api.github.com/repos/{repo.full_name}/contents/{path}",
            params={"ref": branch},
            headers=_gh_headers(user.github_token),
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text[:200])
    return r.json()


@router.get("/{rid}/file")
async def get_file(rid: str, path: str, ref: str = "", user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    repo = (await db.execute(select(Repo).where(Repo.id == rid, Repo.user_id == user.id))).scalar_one_or_none()
    if not repo:
        raise HTTPException(404)
    branch = ref or repo.default_branch
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"https://api.github.com/repos/{repo.full_name}/contents/{path}",
            params={"ref": branch},
            headers=_gh_headers(user.github_token),
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, "File not found")
    data    = r.json()
    content = base64.b64decode(data["content"].replace("\n", "")).decode("utf-8", errors="replace")
    return {"path": path, "content": content, "sha": data.get("sha"), "size": data.get("size")}


class WriteFile(BaseModel):
    path:           str
    content:        str
    commit_message: str = "Update via AgentForge"
    branch:         str = ""
    sha:            str | None = None


@router.post("/{rid}/file")
async def write_file(rid: str, body: WriteFile, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    repo   = (await db.execute(select(Repo).where(Repo.id == rid, Repo.user_id == user.id))).scalar_one_or_none()
    if not repo:
        raise HTTPException(404)
    branch = body.branch or repo.default_branch
    hdrs   = _gh_headers(user.github_token)

    async with httpx.AsyncClient(timeout=15) as client:
        # Get current SHA if not provided
        sha = body.sha
        if not sha:
            ex = await client.get(
                f"https://api.github.com/repos/{repo.full_name}/contents/{body.path}",
                params={"ref": branch}, headers=hdrs,
            )
            if ex.status_code == 200:
                sha = ex.json().get("sha")

        payload = {
            "message": body.commit_message,
            "content": base64.b64encode(body.content.encode()).decode(),
            "branch":  branch,
        }
        if sha:
            payload["sha"] = sha

        r = await client.put(
            f"https://api.github.com/repos/{repo.full_name}/contents/{body.path}",
            json=payload, headers=hdrs,
        )
    if r.status_code not in (200, 201):
        raise HTTPException(r.status_code, r.text[:300])
    data   = r.json()
    commit = data.get("commit", {})
    return {
        "ok":     True,
        "sha":    data.get("content", {}).get("sha"),
        "commit": commit.get("sha", "")[:8],
        "url":    commit.get("html_url"),
    }


@router.delete("/{rid}/file")
async def delete_file(rid: str, path: str, commit_message: str = "Delete via AgentForge", branch: str = "", sha: str = "", user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    repo = (await db.execute(select(Repo).where(Repo.id == rid, Repo.user_id == user.id))).scalar_one_or_none()
    if not repo:
        raise HTTPException(404)
    br   = branch or repo.default_branch
    hdrs = _gh_headers(user.github_token)

    async with httpx.AsyncClient(timeout=15) as client:
        file_sha = sha
        if not file_sha:
            ex = await client.get(
                f"https://api.github.com/repos/{repo.full_name}/contents/{path}",
                params={"ref": br}, headers=hdrs,
            )
            if ex.status_code != 200:
                raise HTTPException(404, "File not found")
            file_sha = ex.json().get("sha")

        r = await client.delete(
            f"https://api.github.com/repos/{repo.full_name}/contents/{path}",
            json={"message": commit_message, "sha": file_sha, "branch": br},
            headers=hdrs,
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text[:300])
    return {"ok": True}


@router.get("/{rid}/branches")
async def list_branches(rid: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    repo = (await db.execute(select(Repo).where(Repo.id == rid, Repo.user_id == user.id))).scalar_one_or_none()
    if not repo:
        raise HTTPException(404)
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"https://api.github.com/repos/{repo.full_name}/branches",
            headers=_gh_headers(user.github_token),
        )
    return r.json()


class CreatePR(BaseModel):
    title: str
    body:  str = ""
    head:  str
    base:  str = "main"


@router.post("/{rid}/pulls")
async def create_pr(rid: str, body: CreatePR, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    repo = (await db.execute(select(Repo).where(Repo.id == rid, Repo.user_id == user.id))).scalar_one_or_none()
    if not repo:
        raise HTTPException(404)
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"https://api.github.com/repos/{repo.full_name}/pulls",
            json={"title": body.title, "body": body.body, "head": body.head, "base": body.base},
            headers=_gh_headers(user.github_token),
        )
    if r.status_code == 201:
        pr = r.json()
        return {"url": pr.get("html_url"), "number": pr.get("number")}
    raise HTTPException(r.status_code, r.text[:300])
