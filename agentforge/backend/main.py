import os, logging
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import auth, sessions, repos, messages, execute, settings, ws_agent

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="AgentForge API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    log.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    log.info(f"Response status: {response.status_code}")
    return response

@app.on_event("startup")
async def startup():
    await init_db()
    log.info("Database initialized")

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(repos.router)
app.include_router(messages.router)
app.include_router(execute.router)
app.include_router(settings.router)
app.include_router(ws_agent.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
