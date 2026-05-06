from fastapi import APIRouter
from pydantic import BaseModel
import httpx

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
