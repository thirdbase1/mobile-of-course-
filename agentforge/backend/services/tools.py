import os, json, base64, asyncio, re, logging, subprocess
import httpx
from pathlib import Path
from database import Repo
from services.workspace import get_workspace_path

log = logging.getLogger(__name__)

# Using Wandbox API (Free, no key required)
WANDBOX_URL = "https://wandbox.org/api/compile.json"

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

# ─── Tool definitions sent to every model ─────────────────────────────────────

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
                    "branch":  {"type": "string", "description": "Target branch (will be created if doesn't exist)", "default": "main"},
                },
                "required": ["message"],
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
        "github_create_pr": _gh_create_pr,
        "web_search":      _web_search,
    }.get(name)
    if not fn: return f"Unknown tool: {name}"
    try:
        return await fn(args, ctx)
    except Exception as e:
        log.exception(f"Tool {name} failed")
        return f"Tool error: {e}"


# ─── Local Workspace Tools ─────────────────────────────────────────────────────

def _safe_path(base: Path, relative: str) -> Path:
    target = (base / relative).resolve()
    if not str(target).startswith(str(base.resolve())):
        raise ValueError("Access outside workspace not allowed")
    return target

async def _read_file(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args["path"])
    if not path.is_file(): return f"Error: {args['path']} is not a file or does not exist."
    content = path.read_text(errors="replace")
    return f"File: {args['path']}\n---\n{content}"

async def _write_file(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args["path"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(args["content"])
    return f"✓ Successfully wrote to {args['path']}"

async def _list_files(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args.get("path", ""))
    if not path.is_dir(): return f"Error: {args.get('path')} is not a directory."
    items = []
    for item in sorted(path.iterdir()):
        if item.name.startswith(".git") and item.name != ".gitignore": continue
        icon = "📁" if item.is_dir() else "📄"
        items.append(f"{icon} {item.name}")
    return f"Contents of {args.get('path') or '/'}:\n" + "\n".join(items)

async def _delete_file(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args["path"])
    if path.is_dir():
        shutil.rmtree(path)
    else:
        path.unlink()
    return f"✓ Deleted {args['path']}"

async def _run_bash(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    cmd = args["command"]

    # Block some dangerous commands if needed, but for now trust the isolation/agent
    process = await asyncio.create_subprocess_shell(
        cmd,
        cwd=str(ws),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()

    out = []
    if stdout: out.append(f"STDOUT:\n{stdout.decode(errors='replace')}")
    if stderr: out.append(f"STDERR:\n{stderr.decode(errors='replace')}")
    out.append(f"[Exit Code: {process.returncode}]")
    return "\n".join(out)


# ─── GitHub Workspace Tools ────────────────────────────────────────────────────

async def _gh_commit_push(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    msg = args["message"]
    branch = args.get("branch", "main")
    token = ctx.get("github_token")
    repo = ctx.get("default_repo")

    if not repo or not token: return "Error: Repo or Token missing."

    cmds = [
        ["git", "config", "user.email", "agent@agentforge.app"],
        ["git", "config", "user.name", "AgentForge"],
        ["git", "add", "."],
        ["git", "commit", "-m", msg],
        ["git", "push", "origin", f"HEAD:{branch}"]
    ]

    results = []
    for c in cmds:
        p = await asyncio.create_subprocess_exec(*c, cwd=str(ws), stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        so, se = await p.communicate()
        if p.returncode != 0 and c[0] == "git" and c[1] == "commit":
            if "nothing to commit" in se.decode().lower(): continue
        if p.returncode != 0:
            return f"Error at step {' '.join(c)}: {se.decode()}"
        results.append(so.decode())

    return f"✓ Changes committed and pushed to branch '{branch}' in {repo}"

async def _gh_create_pr(args: dict, ctx: dict) -> str:
    token = ctx.get("github_token")
    if not token: return "No GitHub token."
    repo = args["repo"]
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"https://api.github.com/repos/{repo}/pulls",
            json={"title": args["title"], "body": args["body"], "head": args["head"], "base": args.get("base", "main")},
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
        )
    if r.status_code == 201:
        pr = r.json()
        return f"✓ PR created: {pr.get('html_url')}"
    return f"Error creating PR: {r.json().get('message')}"


# ─── Web tools (same as before but simplified) ──────────────────────────────────

async def _web_search(args: dict, ctx: dict) -> str:
    query = args["query"]
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get("https://api.duckduckgo.com/", params={"q": query, "format": "json", "no_html": 1})
        data = r.json()
        res = [f"**{data.get('Heading', query)}**\n{data.get('AbstractText', '')}"]
        for t in data.get("RelatedTopics", [])[:3]:
            if isinstance(t, dict) and t.get("Text"): res.append(t["Text"])
        return "\n\n".join(res)
    except: return "No search results found."

