from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os, logging

logging.basicConfig(level=logging.INFO)

from database import init_db
from routers import auth, sessions, messages, repos, execute, settings, ws_agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AgentForge API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/auth",     tags=["auth"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(messages.router, prefix="/sessions", tags=["messages"])
app.include_router(repos.router,    prefix="/repos",    tags=["repos"])
app.include_router(execute.router,  prefix="/execute",  tags=["execute"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(ws_agent.router, prefix="/ws",       tags=["ws"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
