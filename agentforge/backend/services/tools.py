import os, json, base64, asyncio, re, logging, shutil
import httpx
from pathlib import Path
from database import Repo
from services.workspace import get_workspace_path

log = logging.getLogger(__name__)

# ─── Tool definitions ─────────────────────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the contents of a file from the local workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path relative to workspace root"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write or overwrite a file in the local workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path":    {"type": "string", "description": "Path relative to workspace root"},
                    "content": {"type": "string", "description": "New content of the file"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List files in the local workspace at a given path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Directory path relative to root", "default": ""},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "Delete a file or directory from the local workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path relative to root"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_bash",
            "description": "Run a bash command in the local workspace. Use this for testing, building, or running tools.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "The bash command to run"},
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_commit_and_push",
            "description": "Commit all current changes in the local workspace and push them to GitHub.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Commit message"},
                    "branch":  {"type": "string", "description": "Target branch", "default": "main"},
                },
                "required": ["message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_create_repository",
            "description": "Create a new GitHub repository from the current sandbox project.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Repository name"},
                    "private": {"type": "boolean", "description": "Whether the repo should be private", "default": False},
                    "description": {"type": "string", "description": "Repository description"},
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_create_pr",
            "description": "Create a pull request on GitHub.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":  {"type": "string", "description": "Repository 'owner/name'"},
                    "title": {"type": "string", "description": "PR title"},
                    "body":  {"type": "string", "description": "PR body"},
                    "head":  {"type": "string", "description": "Branch with changes"},
                    "base":  {"type": "string", "description": "Target branch", "default": "main"},
                },
                "required": ["repo", "title", "body", "head"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for info.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                },
                "required": ["query"],
            },
        },
    },
]

# ─── Dispatcher ────────────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict, ctx: dict) -> str:
    fn = {
        "read_file":      _read_file,
        "write_file":     _write_file,
        "list_files":     _list_files,
        "delete_file":    _delete_file,
        "run_bash":       _run_bash,
        "github_commit_and_push": _gh_commit_push,
        "github_create_repository": _gh_create_repo,
        "github_create_pr": _gh_create_pr,
        "web_search":      _web_search,
    }.get(name)
    if not fn: return f"Unknown tool: {name}"
    try:
        return await fn(args, ctx)
    except Exception as e:
        log.exception(f"Tool {name} failed")
        return f"Tool error: {e}"

# ─── Handlers ──────────────────────────────────────────────────────────────────

def _safe_path(base: Path, relative: str) -> Path:
    target = (base / relative).resolve()
    if not str(target).startswith(str(base.resolve())):
        raise ValueError("Access outside workspace not allowed")
    return target

async def _read_file(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args["path"])
    if not path.is_file(): return f"Error: {args['path']} not found."
    return f"File: {args['path']}\n---\n{path.read_text(errors='replace')}"

async def _write_file(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args["path"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(args["content"])
    return f"✓ Wrote to {args['path']}"

async def _list_files(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args.get("path", ""))
    if not path.is_dir(): return f"Error: {args.get('path')} is not a directory."
    items = [f"{'📁' if i.is_dir() else '📄'} {i.name}" for i in sorted(path.iterdir()) if not i.name.startswith(".git") or i.name == ".gitignore"]
    return f"Contents of {args.get('path') or '/'}:\n" + "\n".join(items)

async def _delete_file(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args["path"])
    if path.is_dir(): shutil.rmtree(path)
    else: path.unlink()
    return f"✓ Deleted {args['path']}"

async def _run_bash(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    process = await asyncio.create_subprocess_shell(args["command"], cwd=str(ws), stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await process.communicate()
    out = []
    if stdout: out.append(f"STDOUT:\n{stdout.decode(errors='replace')}")
    if stderr: out.append(f"STDERR:\n{stderr.decode(errors='replace')}")
    out.append(f"[Exit Code: {process.returncode}]")
    return "\n".join(out)

async def _gh_commit_push(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    token, repo = ctx.get("github_token"), ctx.get("default_repo")
    if not repo or not token: return "Error: Repo or Token missing."
    branch = args.get("branch", "main")
    cmds = [["git", "config", "user.email", "agent@agentforge.app"], ["git", "config", "user.name", "AgentForge"], ["git", "add", "."], ["git", "commit", "-m", args["message"]], ["git", "push", "origin", f"HEAD:{branch}"]]
    for c in cmds:
        p = await asyncio.create_subprocess_exec(*c, cwd=str(ws), stderr=asyncio.subprocess.PIPE)
        _, se = await p.communicate()
        if p.returncode != 0 and "nothing to commit" not in se.decode().lower(): return f"Error at {' '.join(c)}: {se.decode()}"
    return f"✓ Changes pushed to branch '{branch}' in {repo}"

async def _gh_create_repo(args: dict, ctx: dict) -> str:
    token = ctx.get("github_token")
    if not token: return "No GitHub token."
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post("https://api.github.com/user/repos", json={"name": args["name"], "private": args.get("private", False), "description": args.get("description", "")}, headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"})
    if r.status_code != 201: return f"Error: {r.json().get('message')}"
    repo_full = r.json()["full_name"]
    ws = get_workspace_path(ctx["session_id"])
    cmds = [["git", "init"], ["git", "remote", "add", "origin", f"https://x-access-token:{token}@github.com/{repo_full}.git"], ["git", "add", "."], ["git", "commit", "-m", "Initial commit"], ["git", "branch", "-M", "main"], ["git", "push", "-u", "origin", "main"]]
    for c in cmds: await (await asyncio.create_subprocess_exec(*c, cwd=str(ws))).wait()
    return f"✓ Repo created: {r.json().get('html_url')}"

async def _gh_create_pr(args: dict, ctx: dict) -> str:
    token = ctx.get("github_token")
    if not token: return "No GitHub token."
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(f"https://api.github.com/repos/{args['repo']}/pulls", json={"title": args["title"], "body": args["body"], "head": args["head"], "base": args.get("base", "main")}, headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"})
    if r.status_code == 201: return f"✓ PR created: {r.json().get('html_url')}"
    return f"Error: {r.json().get('message')}"

async def _web_search(args: dict, ctx: dict) -> str:
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get("https://api.duckduckgo.com/", params={"q": args["query"], "format": "json", "no_html": 1})
    data = r.json()
    return f"**{data.get('Heading')}**\n{data.get('AbstractText')}"
