import os
import json
import shutil
import asyncio
import logging
import difflib
import httpx
from pathlib import Path
from services.workspace import get_workspace_path

log = logging.getLogger(__name__)

# ─── Tool Definitions ─────────────────────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read content of a file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Relative path to file"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write or overwrite a file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path":    {"type": "string", "description": "Relative path to file"},
                    "content": {"type": "string", "description": "Full file content"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_files",
            "description": "POWER TOOL: Write multiple files in a single batch. Use this for high-speed parallel development.",
            "parameters": {
                "type": "object",
                "properties": {
                    "files": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "path": {"type": "string"},
                                "content": {"type": "string"}
                            },
                            "required": ["path", "content"]
                        }
                    }
                },
                "required": ["files"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List files in a directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Directory to list", "default": ""},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "Delete a file or directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path to delete"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_bash",
            "description": "Run a bash command in the sandbox.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Bash command"},
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_bash_parallel",
            "description": "POWER TOOL: Run multiple bash commands in parallel inside the sandbox.",
            "parameters": {
                "type": "object",
                "properties": {
                    "commands": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["commands"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Search for text in files.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Text to search for"},
                    "path":  {"type": "string", "description": "Directory to search", "default": ""},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_codebase",
            "description": "Get a high-level overview of the project structure and frameworks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Directory to analyze", "default": ""},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_diff",
            "description": "Get git diff for a file or directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path to get diff for", "default": "."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_create_repository",
            "description": "Create a new repository on GitHub.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name":        {"type": "string", "description": "Repo name"},
                    "private":     {"type": "boolean", "description": "Is private?", "default": False},
                    "description": {"type": "string", "description": "Repo description"},
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_git_operation",
            "description": "Perform various git operations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "operation":  {"type": "string", "enum": ["createBranch", "checkoutBranch", "listBranches", "getCommitHistory"]},
                    "branchName": {"type": "string", "description": "Name of the branch"},
                    "baseBranch": {"type": "string", "description": "Base branch for creation", "default": "main"},
                },
                "required": ["operation"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_commit_and_push",
            "description": "Commit all changes and push to a branch.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Commit message"},
                    "branch":  {"type": "string", "description": "Branch to push to", "default": "main"},
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
                    "repo":  {"type": "string", "description": "Owner/Repo name"},
                    "title": {"type": "string", "description": "PR title"},
                    "body":  {"type": "string", "description": "PR body/description"},
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
        "write_files":    _write_files_batch,
        "list_files":     _list_files,
        "delete_file":    _delete_file,
        "run_bash":       _run_bash,
        "run_bash_parallel": _run_bash_parallel,
        "search_files":   _search_files,
        "analyze_codebase": _analyze_codebase,
        "get_diff":       _get_diff,
        "github_create_repository": _gh_create_repo,
        "github_git_operation": _gh_git_op,
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

    old_content = ""
    if path.is_file():
        old_content = path.read_text(errors='replace')

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(args["content"])

    if "websocket" in ctx:
        await ctx["websocket"].send_json({
            "type": "file_changed",
            "path": args["path"],
            "operation": "write"
        })

    added, removed = 0, 0
    for line in difflib.unified_diff(old_content.splitlines(), args["content"].splitlines()):
        if line.startswith("+") and not line.startswith("+++"): added += 1
        elif line.startswith("-") and not line.startswith("---"): removed += 1

    res = {"status": "success", "path": args["path"], "added": added, "removed": removed}
    return json.dumps(res)

async def _write_files_batch(args: dict, ctx: dict) -> str:
    results = []
    for f in args["files"]:
        res_str = await _write_file(f, ctx)
        results.append(json.loads(res_str))
    return json.dumps(results)

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

    if "websocket" in ctx:
        await ctx["websocket"].send_json({
            "type": "file_changed",
            "path": args["path"],
            "operation": "delete"
        })

    return f"✓ Deleted {args['path']}"

async def _run_bash(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    cmd = args["command"]

    process = await asyncio.create_subprocess_shell(
        cmd,
        cwd=str(ws),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    full_stdout = b""
    full_stderr = b""

    async def stream_pipe(pipe, label):
        nonlocal full_stdout, full_stderr
        while True:
            line = await pipe.readline()
            if not line: break
            if label == "stdout": full_stdout += line
            else: full_stderr += line

            if "websocket" in ctx:
                await ctx["websocket"].send_json({
                    "type": "terminal_log",
                    "content": line.decode(errors='replace'),
                    "stream": label
                })

    await asyncio.gather(
        stream_pipe(process.stdout, "stdout"),
        stream_pipe(process.stderr, "stderr")
    )

    await process.wait()

    out = []
    if full_stdout: out.append(f"STDOUT:\n{full_stdout.decode(errors='replace')}")
    if full_stderr: out.append(f"STDERR:\n{full_stderr.decode(errors='replace')}")
    out.append(f"[Exit Code: {process.returncode}]")
    return "\n".join(out)

async def _run_bash_parallel(args: dict, ctx: dict) -> str:
    results = await asyncio.gather(*(
        _run_bash({"command": cmd}, ctx) for cmd in args["commands"]
    ))
    return "\n---\n".join(results)

async def _search_files(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    search_path = _safe_path(ws, args.get("path", ""))
    query = args["query"]

    results = []
    for root, _, files in os.walk(search_path):
        if ".git" in root: continue
        for file in files:
            p = Path(root) / file
            try:
                content = p.read_text(errors='replace')
                if query in content:
                    rel = p.relative_to(ws)
                    results.append(f"📄 {rel}")
            except: continue

    return f"Search results for '{query}':\n" + ("\n".join(results[:50]) if results else "No results found.")

async def _analyze_codebase(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    path = _safe_path(ws, args.get("path", ""))

    analysis = []
    if (ws / "package.json").exists(): analysis.append("- Node.js project detected")
    if (ws / "requirements.txt").exists() or (ws / "pyproject.toml").exists(): analysis.append("- Python project detected")
    if (ws / "tsconfig.json").exists(): analysis.append("- TypeScript configured")
    if (ws / "next.config.js").exists() or (ws / "next.config.mjs").exists(): analysis.append("- Next.js framework")

    items = [f"{'📁' if i.is_dir() else '📄'} {i.name}" for i in sorted(path.iterdir()) if not i.name.startswith(".git")]

    return "Codebase Analysis:\n" + "\n".join(analysis) + "\n\nRoot Structure:\n" + "\n".join(items)

async def _get_diff(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    if (ws / ".git").exists():
        process = await asyncio.create_subprocess_exec("git", "diff", args["path"], cwd=str(ws), stdout=asyncio.subprocess.PIPE)
        stdout, _ = await process.communicate()
        return stdout.decode(errors='replace') or "No changes detected."
    return "No git repository initialized in this workspace."

async def _gh_git_op(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    op = args["operation"]

    if op == "createBranch":
        cmd = ["git", "checkout", "-b", args["branchName"], args.get("baseBranch", "main")]
    elif op == "checkoutBranch":
        cmd = ["git", "checkout", args["branchName"]]
    elif op == "listBranches":
        cmd = ["git", "branch", "-a"]
    elif op == "getCommitHistory":
        cmd = ["git", "log", "--oneline", "-n", "10"]
    else: return "Unknown operation"

    process = await asyncio.create_subprocess_exec(*cmd, cwd=str(ws), stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await process.communicate()

    if process.returncode != 0: return f"Git Error: {stderr.decode()}"
    return stdout.decode() or "Operation successful."

async def _gh_commit_push(args: dict, ctx: dict) -> str:
    ws = get_workspace_path(ctx["session_id"])
    token, repo = ctx.get("github_token"), ctx.get("default_repo")
    if not repo or not token: return "Error: Repo or Token missing."
    branch = args.get("branch", "main")

    # Git config
    await (await asyncio.create_subprocess_exec("git", "config", "user.email", "agent@gitcode.app", cwd=str(ws))).wait()
    await (await asyncio.create_subprocess_exec("git", "config", "user.name", "GITCODE", cwd=str(ws))).wait()

    # Add, commit, push
    steps = [
        ["git", "add", "."],
        ["git", "commit", "-m", args["message"]],
        ["git", "push", "origin", f"HEAD:{branch}"]
    ]

    for c in steps:
        if "websocket" in ctx:
            await ctx["websocket"].send_json({"type": "terminal_log", "content": f"$ {' '.join(c)}\n", "stream": "stdout"})

        p = await asyncio.create_subprocess_exec(
            *c,
            cwd=str(ws),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        async def stream_p(pipe, label):
            while True:
                l = await pipe.readline()
                if not l: break
                if "websocket" in ctx:
                    await ctx["websocket"].send_json({"type": "terminal_log", "content": l.decode(errors='replace'), "stream": label})

        await asyncio.gather(stream_p(p.stdout, "stdout"), stream_p(p.stderr, "stderr"))
        await p.wait()

        if p.returncode != 0:
            if c[1] == "commit" and "nothing to commit" in (await p.stderr.read()).decode().lower():
                continue
            return f"Error at {' '.join(c)}: Exit code {p.returncode}"

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
