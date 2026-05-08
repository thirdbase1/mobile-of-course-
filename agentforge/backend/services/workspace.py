import os
import shutil
import asyncio
import logging
import subprocess
from pathlib import Path

log = logging.getLogger(__name__)

BASE_WORKSPACE_DIR = Path("/tmp/agentforge")

def get_workspace_path(session_id: str) -> Path:
    return BASE_WORKSPACE_DIR / session_id

async def init_workspace(session_id: str):
    path = get_workspace_path(session_id)
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
    return path

async def cleanup_workspace(session_id: str):
    path = get_workspace_path(session_id)
    if path.exists():
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, shutil.rmtree, path)

async def clone_repo_to_workspace(session_id: str, repo_full_name: str, github_token: str, branch: str = "main", websocket = None):
    path = await init_workspace(session_id)

    # Check if repo is already cloned and on the correct branch
    git_dir = path / ".git"
    if git_dir.exists():
        try:
            res = subprocess.run(["git", "remote", "get-url", "origin"], cwd=str(path), capture_output=True, text=True)
            if repo_full_name in res.stdout:
                log.info(f"Workspace {session_id} already has {repo_full_name}. Skipping clone.")
                return True, "Repository already initialized in workspace"
        except Exception as e:
            log.warning(f"Existing workspace at {path} is invalid: {e}. Re-cloning.")

    if any(path.iterdir()):
        await cleanup_workspace(session_id)
        await init_workspace(session_id)

    clone_url = f"https://x-access-token:{github_token}@github.com/{repo_full_name}.git"
    cmd = ["git", "clone", "--depth", "1", "--branch", branch, clone_url, str(path)]

    if websocket:
        await websocket.send_json({"type": "terminal_log", "content": f"$ git clone --branch {branch} {repo_full_name} .\n", "stream": "stdout"})

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    async def stream_pipe(pipe, label):
        while True:
            line = await pipe.readline()
            if not line: break
            if websocket:
                await websocket.send_json({"type": "terminal_log", "content": line.decode(errors='replace'), "stream": label})

    await asyncio.gather(
        stream_pipe(process.stdout, "stdout"),
        stream_pipe(process.stderr, "stderr")
    )

    await process.wait()

    if process.returncode != 0:
        log.error(f"Failed to clone repo {repo_full_name}: Exit code {process.returncode}")
        return False, "Git clone failed"

    return True, "Successfully cloned repository"
