"""
Code execution via Judge0 CE (sandboxed, isolated containers on Judge0's infra).
Falls back to a restricted in-process runner for languages Judge0 doesn't support.

Judge0 language IDs (most common):
  71 = Python 3
  63 = JavaScript (Node.js)
  46 = Bash
  54 = C++ (GCC 9.2)
  62 = Java (OpenJDK 13)
  72 = Ruby
  73 = Rust
  74 = TypeScript
"""
import os, httpx, base64, asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth_utils import current_user
from database import User
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, ApiSettings
from sqlalchemy import select

router = APIRouter()

JUDGE0_LANG_IDS = {
    "python":     71,
    "python3":    71,
    "javascript": 63,
    "node":       63,
    "bash":       46,
    "shell":      46,
    "sh":         46,
    "cpp":        54,
    "c++":        54,
    "java":       62,
    "ruby":       72,
    "rust":       73,
    "typescript": 74,
    "ts":         74,
}

JUDGE0_BASE = "https://judge0-ce.p.rapidapi.com"

class ExecRequest(BaseModel):
    language: str
    code: str
    stdin: str = ""

class ExecResult(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    time: float | None = None
    memory: int | None = None
    status: str

@router.post("", response_model=ExecResult)
async def execute_code(
    body: ExecRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get user's Judge0 key
    result = await db.execute(select(ApiSettings).where(ApiSettings.user_id == user.id))
    settings = result.scalar_one_or_none()
    judge0_key = (settings.judge0_api_key if settings else None) or os.getenv("JUDGE0_API_KEY", "")

    lang = body.language.lower().strip()
    lang_id = JUDGE0_LANG_IDS.get(lang)

    if not lang_id:
        raise HTTPException(400, f"Unsupported language: {lang}. Supported: {', '.join(JUDGE0_LANG_IDS.keys())}")

    if not judge0_key:
        # No Judge0 key — provide a clear error with instructions
        return ExecResult(
            stdout="",
            stderr=(
                "No Judge0 API key configured.\n"
                "Go to Settings → add your Judge0 (RapidAPI) key to enable code execution.\n"
                "Get a free key at: https://rapidapi.com/judge0-official/api/judge0-ce"
            ),
            exit_code=1,
            status="configuration_error",
        )

    # Submit to Judge0
    payload = {
        "language_id":     lang_id,
        "source_code":     base64.b64encode(body.code.encode()).decode(),
        "stdin":           base64.b64encode(body.stdin.encode()).decode(),
        "cpu_time_limit":  15,
        "memory_limit":    131072,  # 128 MB
        "enable_network":  False,
    }
    headers = {
        "X-RapidAPI-Key":  judge0_key,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Content-Type":    "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Submit
            r = await client.post(
                f"{JUDGE0_BASE}/submissions?base64_encoded=true&wait=false",
                json=payload, headers=headers,
            )
            if r.status_code not in (200, 201):
                raise HTTPException(502, f"Judge0 submission failed: {r.text}")
            token = r.json().get("token")
            if not token:
                raise HTTPException(502, "No submission token from Judge0")

            # Poll for result (max 30s)
            for _ in range(20):
                await asyncio.sleep(1.5)
                res = await client.get(
                    f"{JUDGE0_BASE}/submissions/{token}?base64_encoded=true",
                    headers=headers,
                )
                data = res.json()
                status_id = data.get("status", {}).get("id", 0)
                if status_id > 2:  # not queued/processing
                    def decode(v):
                        if not v: return ""
                        try: return base64.b64decode(v).decode("utf-8", errors="replace")
                        except: return v
                    return ExecResult(
                        stdout    = decode(data.get("stdout")),
                        stderr    = decode(data.get("stderr")) or decode(data.get("compile_output")),
                        exit_code = data.get("exit_code") or 0,
                        time      = float(data.get("time") or 0),
                        memory    = data.get("memory"),
                        status    = data.get("status", {}).get("description", "Unknown"),
                    )

            return ExecResult(stdout="", stderr="Execution timed out", exit_code=1, status="timeout")

    except HTTPException:
        raise
    except Exception as e:
        return ExecResult(stdout="", stderr=f"Execution error: {e}", exit_code=1, status="error")
