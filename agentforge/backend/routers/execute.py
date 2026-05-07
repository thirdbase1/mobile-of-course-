from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx
from database import get_db, Message, Session
from auth_utils import current_user
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/execute", tags=["execute"])

class ExecuteRequest(BaseModel):
    language: str
    code: str
    stdin: str = ""

WANDBOX_URL = "https://wandbox.org/api/compile.json"
WANDBOX_COMPILERS = {
    "python": "cpython-3.12.7", "javascript": "nodejs-20.17.0",
    "bash": "bash", "cpp": "gcc-13.2.0", "ruby": "ruby-3.3.5",
    "rust": "rust-1.82.0", "go": "go-1.23.2",
}

@router.post("")
async def execute_code(req: ExecuteRequest):
    compiler = WANDBOX_COMPILERS.get(req.language.lower(), "cpython-3.12.7")
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(WANDBOX_URL, json={
            "compiler": compiler,
            "code": req.code,
            "stdin": req.stdin
        })
    return r.json()

@router.get("/logs/{session_id}")
async def get_sandbox_logs(session_id: str, db: AsyncSession = Depends(get_db), user = Depends(current_user)):
    # Verify session belongs to user
    res = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == user.id))
    if not res.scalar_one_or_none():
        raise HTTPException(404, "Session not found")

    # Get all tool calls and results for this session to reconstruct logs
    res = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .where(Message.role.in_(["tool_call", "tool_result"]))
        .order_by(Message.created_at.asc())
    )
    messages = res.scalars().all()

    logs = []
    for m in messages:
        if m.role == "tool_call":
            logs.append({
                "type": "call",
                "tool": m.tool_name,
                "input": m.tool_input,
                "timestamp": m.created_at
            })
        else:
            logs.append({
                "type": "result",
                "output": m.tool_output,
                "timestamp": m.created_at
            })

    return logs
