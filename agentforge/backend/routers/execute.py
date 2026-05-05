import os, httpx, asyncio, logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from auth_utils import current_user
from database import User, get_db, ApiSettings

router = APIRouter()
log = logging.getLogger(__name__)

# Using Wandbox API (Free, no key required)
WANDBOX_URL = "https://wandbox.org/api/compile.json"

# Mapping for Wandbox
WANDBOX_COMPILERS = {
    "python": "cpython-3.12.7", "python3": "cpython-3.12.7",
    "javascript": "nodejs-20.17.0", "js": "nodejs-20.17.0", "node": "nodejs-20.17.0",
    "bash": "bash", "shell": "bash", "sh": "bash",
    "cpp": "gcc-13.2.0", "c++": "gcc-13.2.0", "c": "gcc-13.2.0-c",
    "java": "openjdk-head",
    "ruby": "ruby-3.3.5",
    "rust": "rust-1.82.0",
    "typescript": "typescript-5.6.2", "ts": "typescript-5.6.2",
    "go": "go-1.23.2",
    "php": "php-8.3.11",
}

class ExecReq(BaseModel):
    language: str
    code:     str
    stdin:    str = ""

@router.post("")
async def execute_code(body: ExecReq, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    lang = body.language.lower().strip()
    compiler = WANDBOX_COMPILERS.get(lang)

    if not compiler:
        raise HTTPException(400, f"Unsupported language '{lang}'.")

    pay = {
        "compiler": compiler,
        "code": body.code,
        "stdin": body.stdin,
        "save": False
    }

    async with httpx.AsyncClient(timeout=45) as client:
        try:
            r = await client.post(WANDBOX_URL, json=pay)
            if r.status_code != 200:
                return {"stdout": "", "stderr": f"Sandbox error ({r.status_code}): {r.text[:200]}", "exit_code": 1, "status": "error"}

            data = r.json()
            # Wandbox returns status "0" for success (string)
            status_code = data.get("status", "1")

            stdout = data.get("program_output", "")
            stderr = data.get("program_error", "") or data.get("compiler_error", "")

            return {
                "stdout":    stdout,
                "stderr":    stderr,
                "exit_code": 0 if status_code == "0" else 1,
                "status":    "success" if status_code == "0" else "failed"
            }
        except Exception as e:
            log.exception("Wandbox execution failed")
            return {"stdout": "", "stderr": f"Sandbox connection failed: {str(e)}", "exit_code": 1, "status": "error"}
