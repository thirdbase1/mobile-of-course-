import os, httpx, base64, asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from auth_utils import current_user
from database import User, get_db, ApiSettings

router = APIRouter()

JUDGE0_BASE = "https://judge0-ce.p.rapidapi.com"
LANG_IDS    = {
    "python": 71, "python3": 71,
    "javascript": 63, "js": 63, "node": 63,
    "bash": 46, "shell": 46, "sh": 46,
    "cpp": 54, "c++": 54, "c": 50,
    "java": 62,
    "ruby": 72,
    "rust": 73,
    "typescript": 74, "ts": 74,
    "go": 60,
    "php": 68,
    "swift": 83,
    "kotlin": 78,
    "r": 80,
}


class ExecReq(BaseModel):
    language: str
    code:     str
    stdin:    str = ""


@router.post("")
async def execute_code(body: ExecReq, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    s    = (await db.execute(select(ApiSettings).where(ApiSettings.user_id == user.id))).scalar_one_or_none()
    key  = (s.judge0_api_key if s else None) or os.getenv("JUDGE0_API_KEY", "")
    lang = body.language.lower().strip()
    lid  = LANG_IDS.get(lang)

    if not lid:
        raise HTTPException(400, f"Unsupported language '{lang}'. Supported: {', '.join(LANG_IDS)}")
    if not key:
        return {"stdout": "", "stderr": "No Judge0 API key — add one in Settings to enable code execution.", "exit_code": 1, "status": "no_key"}

    hdrs = {"X-RapidAPI-Key": key, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com", "Content-Type": "application/json"}
    pay  = {
        "language_id": lid,
        "source_code": base64.b64encode(body.code.encode()).decode(),
        "stdin":       base64.b64encode(body.stdin.encode()).decode(),
        "cpu_time_limit": 15, "memory_limit": 131072, "enable_network": False,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(f"{JUDGE0_BASE}/submissions?base64_encoded=true&wait=false", json=pay, headers=hdrs)
        if r.status_code not in (200, 201):
            return {"stdout": "", "stderr": f"Judge0 error {r.status_code}: {r.text[:200]}", "exit_code": 1, "status": "error"}
        token = r.json().get("token")
        if not token:
            return {"stdout": "", "stderr": "No token from Judge0", "exit_code": 1, "status": "error"}

        for _ in range(25):
            await asyncio.sleep(1.2)
            res  = await client.get(f"{JUDGE0_BASE}/submissions/{token}?base64_encoded=true", headers=hdrs)
            data = res.json()
            if data.get("status", {}).get("id", 0) > 2:
                def dec(v):
                    if not v: return ""
                    try: return base64.b64decode(v).decode("utf-8", errors="replace")
                    except: return v
                return {
                    "stdout":    dec(data.get("stdout")),
                    "stderr":    dec(data.get("stderr")) or dec(data.get("compile_output")),
                    "exit_code": data.get("exit_code") or 0,
                    "time":      data.get("time"),
                    "memory":    data.get("memory"),
                    "status":    data.get("status", {}).get("description", "Unknown"),
                }
    return {"stdout": "", "stderr": "Timed out", "exit_code": 1, "status": "timeout"}
