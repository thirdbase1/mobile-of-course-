from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os, logging, time, sys

# Improved logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout
)
logger = logging.getLogger("agentforge")

from database import init_db
from routers import auth, sessions, messages, repos, execute, settings, ws_agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AgentForge Backend...")
    port = os.getenv("PORT", "8000")
    logger.info(f"Environment PORT: {port}")
    try:
        await init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
    yield
    logger.info("Shutting down AgentForge Backend...")

app = FastAPI(
    title="AgentForge API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        logger.info(f"{request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)")
        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"{request.method} {request.url.path} - FAILED ({duration:.2f}s): {e}", exc_info=True)
        return Response(content="Internal Server Error", status_code=500)

# Include routers
app.include_router(auth.router,     prefix="/auth",     tags=["auth"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(messages.router, prefix="/sessions", tags=["messages"])
app.include_router(repos.router,    prefix="/repos",    tags=["repos"])
app.include_router(execute.router,  prefix="/execute",  tags=["execute"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(ws_agent.router, prefix="/ws",       tags=["ws"])

@app.get("/")
async def root():
    return JSONResponse({
        "name": "AgentForge API",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    })

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "environment": os.getenv("NODE_ENV", "production"),
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    port_str = os.getenv("PORT", "8000")
    try:
        port = int(port_str)
    except ValueError:
        logger.error(f"Invalid PORT value: {port_str}. Defaulting to 8000.")
        port = 8000

    logger.info(f"Manual startup on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
