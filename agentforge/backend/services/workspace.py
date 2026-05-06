import os
import shutil
import asyncio
import logging
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
        # Using run_in_executor because shutil.rmtree is blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, shutil.rmtree, path)

async def clone_repo_to_workspace(session_id: str, repo_full_name: str, github_token: str, branch: str = "main"):
    path = await init_workspace(session_id)

    # Clean if exists
    if any(path.iterdir()):
        await cleanup_workspace(session_id)
        await init_workspace(session_id)

    clone_url = f"https://x-access-token:{github_token}@github.com/{repo_full_name}.git"

    cmd = ["git", "clone", "--depth", "1", "--branch", branch, clone_url, str(path)]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        log.error(f"Failed to clone repo {repo_full_name}: {stderr.decode()}")
        return False, stderr.decode()

    # Remove .git folder to prevent agent from messing with it directly via bash
    # and to ensure tools are used instead.
    # Actually, keep it for now but we might want to hide it.
    return True, "Successfully cloned repository"
