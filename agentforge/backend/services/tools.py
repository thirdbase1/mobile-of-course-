"""
All tools the agent can call.
All three providers (Groq, OpenRouter, xAI) use identical OpenAI-compatible
function calling format — same definitions, same execution logic.
"""
import os, json, base64, asyncio, re, logging
import httpx
from database import Repo

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
# All three providers (Groq, OpenRouter, xAI) accept identical OpenAI-format tools.

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "execute_code",
            "description": (
                "Execute code in a secure isolated sandbox. Supports Python, JavaScript/Node.js, "
                "Bash, C, C++, Java, Ruby, Rust, TypeScript, Go, PHP. "
                "Returns stdout, stderr, exit code, and execution time. "
                "Use this to test code, run scripts, validate logic, process data."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "language": {"type": "string", "description": "Language: python, javascript, bash, cpp, java, ruby, rust, typescript, go, php"},
                    "code":     {"type": "string", "description": "The complete code to execute"},
                    "stdin":    {"type": "string", "description": "Optional stdin input", "default": ""},
                },
                "required": ["language", "code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_read_file",
            "description": "Read the full contents of a file from a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":   {"type": "string", "description": "Repository in 'owner/name' format, e.g. 'octocat/hello-world'"},
                    "path":   {"type": "string", "description": "File path from repo root, e.g. 'src/main.py'"},
                    "branch": {"type": "string", "description": "Branch name (defaults to repo default branch)", "default": "main"},
                },
                "required": ["repo", "path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_write_file",
            "description": (
                "Create or update a file in a GitHub repository. "
                "This automatically commits the change. "
                "Use for saving code changes, creating new files, updating configs."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":    {"type": "string", "description": "Repository in 'owner/name' format"},
                    "path":    {"type": "string", "description": "File path to write, e.g. 'src/utils.py'"},
                    "content": {"type": "string", "description": "Complete file content to write"},
                    "message": {"type": "string", "description": "Git commit message describing the change"},
                    "branch":  {"type": "string", "description": "Branch to commit to", "default": "main"},
                },
                "required": ["repo", "path", "content", "message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_list_files",
            "description": "List files and directories at a path in a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":   {"type": "string", "description": "Repository in 'owner/name' format"},
                    "path":   {"type": "string", "description": "Directory path (empty string for root)", "default": ""},
                    "branch": {"type": "string", "description": "Branch name", "default": "main"},
                },
                "required": ["repo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_delete_file",
            "description": "Delete a file from a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":    {"type": "string", "description": "Repository in 'owner/name' format"},
                    "path":    {"type": "string", "description": "File path to delete"},
                    "message": {"type": "string", "description": "Commit message", "default": "Delete file"},
                    "branch":  {"type": "string", "description": "Branch name", "default": "main"},
                },
                "required": ["repo", "path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_search_code",
            "description": "Search for code patterns or text within a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":  {"type": "string", "description": "Repository in 'owner/name' format"},
                    "query": {"type": "string", "description": "Search query (GitHub code search syntax supported)"},
                },
                "required": ["repo", "query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_create_branch",
            "description": "Create a new branch in a GitHub repository from an existing branch.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":   {"type": "string", "description": "Repository in 'owner/name' format"},
                    "branch": {"type": "string", "description": "New branch name to create"},
                    "from":   {"type": "string", "description": "Source branch to branch from", "default": "main"},
                },
                "required": ["repo", "branch"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_create_pr",
            "description": "Create a pull request in a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":  {"type": "string", "description": "Repository in 'owner/name' format"},
                    "title": {"type": "string", "description": "Pull request title"},
                    "body":  {"type": "string", "description": "PR description (markdown supported)"},
                    "head":  {"type": "string", "description": "Source branch (the branch with changes)"},
                    "base":  {"type": "string", "description": "Target branch to merge into", "default": "main"},
                },
                "required": ["repo", "title", "body", "head", "base"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_list_commits",
            "description": "List recent commits on a branch in a GitHub repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo":   {"type": "string", "description": "Repository in 'owner/name' format"},
                    "branch": {"type": "string", "description": "Branch name", "default": "main"},
                    "limit":  {"type": "integer", "description": "Number of commits to return (max 30)", "default": 10},
                },
                "required": ["repo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": (
                "Search the web for documentation, error messages, API references, library info, "
                "or any current information. Use when you need to look something up."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": "Fetch and read the content of any URL — documentation pages, JSON APIs, raw files, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url":  {"type": "string", "description": "Full URL to fetch"},
                    "mode": {"type": "string", "description": "'text' for HTML/text content, 'json' for JSON APIs", "default": "text"},
                },
                "required": ["url"],
            },
        },
    },
]


# ─── Dispatcher ────────────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict, ctx: dict) -> str:
    fn = {
        "execute_code":       _execute_code,
        "github_read_file":   _gh_read,
        "github_write_file":  _gh_write,
        "github_list_files":  _gh_list,
        "github_delete_file": _gh_delete,
        "github_search_code": _gh_search,
        "github_create_branch": _gh_create_branch,
        "github_create_pr":   _gh_create_pr,
        "github_list_commits": _gh_list_commits,
        "web_search":         _web_search,
        "fetch_url":          _fetch_url,
    }.get(name)
    if not fn:
        return f"Unknown tool: {name}"
    try:
        return await fn(args, ctx)
    except Exception as e:
        log.exception(f"Tool {name} failed")
        return f"Tool error: {e}"


# ─── Code execution ────────────────────────────────────────────────────────────

async def _execute_code(args: dict, ctx: dict) -> str:
    lang  = args.get("language", "python").lower().strip()
    code  = args.get("code", "")
    stdin = args.get("stdin", "")
    compiler = WANDBOX_COMPILERS.get(lang)

    if not compiler:
        return f"Unsupported language '{lang}'. Supported: {', '.join(WANDBOX_COMPILERS.keys())}"

    pay = {
        "compiler": compiler,
        "code": code,
        "stdin": stdin,
        "save": False
    }

    async with httpx.AsyncClient(timeout=45) as client:
        try:
            r = await client.post(WANDBOX_URL, json=pay)
            if r.status_code != 200:
                return f"Sandbox error ({r.status_code}): {r.text[:200]}"

            data = r.json()
            stdout = data.get("program_output", "")
            stderr = data.get("program_error", "") or data.get("compiler_error", "")
            exit_c = data.get("status", "1")

            out = []
            if stdout: out.append(f"STDOUT:\n{stdout.rstrip()}")
            if stderr: out.append(f"STDERR:\n{stderr.rstrip()}")
            out.append(f"[Finished] exit={exit_c}")
            return "\n".join(out) or "(no output)"
        except Exception as e:
            return f"Sandbox connection failed: {e}"


# ─── GitHub helpers ────────────────────────────────────────────────────────────

def _gh_hdrs(ctx: dict) -> dict:
    token = ctx.get("github_token", "")
    if not token:
        raise ValueError("No GitHub token — user needs to sign in with GitHub")
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def _gh_read(args: dict, ctx: dict) -> str:
    hdrs = _gh_hdrs(ctx)
    repo = args.get("repo", "")
    path = args.get("path", "")
    ref  = args.get("branch", "main")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"https://api.github.com/repos/{repo}/contents/{path}", params={"ref": ref}, headers=hdrs)
    if r.status_code != 200:
        return f"Error reading {path} ({r.status_code}): {r.json().get('message', r.text[:200])}"
    data = r.json()
    if isinstance(data, list):
        return f"'{path}' is a directory. Use github_list_files instead."
    raw  = base64.b64decode(data.get("content", "").replace("\n", "")).decode("utf-8", errors="replace")
    size = len(raw.splitlines())
    return f"File: {repo}/{path} ({size} lines)\n```\n{raw}\n```"


async def _gh_write(args: dict, ctx: dict) -> str:
    hdrs    = _gh_hdrs(ctx)
    repo    = args.get("repo", "")
    path    = args.get("path", "")
    content = args.get("content", "")
    msg     = args.get("message", "Update via AgentForge")
    branch  = args.get("branch", "main")

    async with httpx.AsyncClient(timeout=15) as c:
        ex  = await c.get(f"https://api.github.com/repos/{repo}/contents/{path}", params={"ref": branch}, headers=hdrs)
        sha = ex.json().get("sha") if ex.status_code == 200 else None
        pay = {"message": msg, "content": base64.b64encode(content.encode()).decode(), "branch": branch}
        if sha: pay["sha"] = sha
        r   = await c.put(f"https://api.github.com/repos/{repo}/contents/{path}", json=pay, headers=hdrs)

    if r.status_code in (200, 201):
        action = "Updated" if sha else "Created"
        commit = r.json().get("commit", {}).get("sha", "")[:8]
        return f"✓ {action} {repo}/{path} on '{branch}' (commit {commit})"
    return f"Error writing file ({r.status_code}): {r.json().get('message', r.text[:200])}"


async def _gh_list(args: dict, ctx: dict) -> str:
    hdrs   = _gh_hdrs(ctx)
    repo   = args.get("repo", "")
    path   = args.get("path", "")
    branch = args.get("branch", "main")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"https://api.github.com/repos/{repo}/contents/{path}", params={"ref": branch}, headers=hdrs)
    if r.status_code != 200:
        return f"Error listing {path} ({r.status_code}): {r.json().get('message', '')}"
    items = r.json()
    if not isinstance(items, list):
        return "That path is a file, not a directory."
    lines = []
    for item in sorted(items, key=lambda x: (0 if x["type"] == "dir" else 1, x["name"])):
        icon = "📁" if item["type"] == "dir" else "📄"
        size = f" ({item.get('size', 0)} B)" if item["type"] == "file" else ""
        lines.append(f"{icon} {item['name']}{size}")
    return f"Contents of {repo}/{path or '(root)'} [{branch}]:\n" + "\n".join(lines)


async def _gh_delete(args: dict, ctx: dict) -> str:
    hdrs = _gh_hdrs(ctx)
    repo = args.get("repo", "")
    path = args.get("path", "")
    msg  = args.get("message", "Delete file")
    br   = args.get("branch", "main")
    async with httpx.AsyncClient(timeout=15) as c:
        ex = await c.get(f"https://api.github.com/repos/{repo}/contents/{path}", params={"ref": br}, headers=hdrs)
        if ex.status_code != 200:
            return f"File not found: {path}"
        sha = ex.json().get("sha")
        r   = await c.delete(f"https://api.github.com/repos/{repo}/contents/{path}", json={"message": msg, "sha": sha, "branch": br}, headers=hdrs)
    if r.status_code == 200:
        return f"✓ Deleted {repo}/{path} from '{br}'"
    return f"Error deleting ({r.status_code}): {r.json().get('message', '')}"


async def _gh_search(args: dict, ctx: dict) -> str:
    hdrs  = _gh_hdrs(ctx)
    repo  = args.get("repo", "")
    query = args.get("query", "")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            "https://api.github.com/search/code",
            params={"q": f"{query} repo:{repo}", "per_page": 10},
            headers=hdrs,
        )
    if r.status_code == 422:
        return "Search index not ready for this repo. Try reading specific files instead."
    if r.status_code != 200:
        return f"Search error ({r.status_code}): {r.text[:200]}"
    data  = r.json()
    items = data.get("items", [])
    if not items:
        return f"No results for '{query}' in {repo}"
    lines = [f"Found {data.get('total_count', 0)} results for '{query}' in {repo}:\n"]
    for item in items[:8]:
        lines.append(f"📄 {item.get('path')}")
        for match in item.get("text_matches", []):
            snippet = match.get("fragment", "").replace("\n", " ").strip()
            if snippet:
                lines.append(f"   …{snippet[:120]}…")
    return "\n".join(lines)


async def _gh_create_branch(args: dict, ctx: dict) -> str:
    hdrs   = _gh_hdrs(ctx)
    repo   = args.get("repo", "")
    branch = args.get("branch", "")
    source = args.get("from", "main")
    async with httpx.AsyncClient(timeout=15) as c:
        ref = await c.get(f"https://api.github.com/repos/{repo}/git/refs/heads/{source}", headers=hdrs)
        if ref.status_code != 200:
            return f"Source branch '{source}' not found"
        sha = ref.json()["object"]["sha"]
        r   = await c.post(f"https://api.github.com/repos/{repo}/git/refs", json={"ref": f"refs/heads/{branch}", "sha": sha}, headers=hdrs)
    if r.status_code == 201:
        return f"✓ Created branch '{branch}' from '{source}' in {repo}"
    if r.status_code == 422:
        return f"Branch '{branch}' already exists"
    return f"Error creating branch ({r.status_code}): {r.json().get('message', '')}"


async def _gh_create_pr(args: dict, ctx: dict) -> str:
    hdrs = _gh_hdrs(ctx)
    repo = args.get("repo", "")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"https://api.github.com/repos/{repo}/pulls",
            json={"title": args.get("title"), "body": args.get("body", ""), "head": args.get("head"), "base": args.get("base", "main")},
            headers=hdrs,
        )
    if r.status_code == 201:
        pr = r.json()
        return f"✓ Pull request created: {pr.get('html_url')} (#{pr.get('number')})"
    return f"Error creating PR ({r.status_code}): {r.json().get('message', r.text[:200])}"


async def _gh_list_commits(args: dict, ctx: dict) -> str:
    hdrs   = _gh_hdrs(ctx)
    repo   = args.get("repo", "")
    branch = args.get("branch", "main")
    limit  = min(args.get("limit", 10), 30)
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            f"https://api.github.com/repos/{repo}/commits",
            params={"sha": branch, "per_page": limit},
            headers=hdrs,
        )
    if r.status_code != 200:
        return f"Error fetching commits ({r.status_code})"
    commits = r.json()
    lines   = [f"Recent commits on '{branch}' in {repo}:\n"]
    for cm in commits:
        sha  = cm.get("sha", "")[:7]
        msg  = cm.get("commit", {}).get("message", "").split("\n")[0][:80]
        auth = cm.get("commit", {}).get("author", {}).get("name", "?")
        date = cm.get("commit", {}).get("author", {}).get("date", "")[:10]
        lines.append(f"  {sha}  {date}  {auth}: {msg}")
    return "\n".join(lines)


# ─── Web tools ──────────────────────────────────────────────────────────────────

async def _web_search(args: dict, ctx: dict) -> str:
    query = args.get("query", "")
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            r = await c.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
                headers={"User-Agent": "AgentForge/2.0"},
            )
        data    = r.json()
        results = []
        if data.get("AbstractText"):
            results.append(f"**{data.get('Heading', query)}**\n{data['AbstractText']}\nSource: {data.get('AbstractURL', '')}")
        for t in data.get("RelatedTopics", [])[:6]:
            if isinstance(t, dict) and t.get("Text"):
                results.append(f"• {t['Text'][:200]}\n  {t.get('FirstURL', '')}")
        if results:
            return f"Search: \"{query}\"\n\n" + "\n\n".join(results)
    except Exception:
        pass
    return f"No results from DuckDuckGo for \"{query}\". Try fetch_url with a specific documentation URL."


async def _fetch_url(args: dict, ctx: dict) -> str:
    url  = args.get("url", "")
    mode = args.get("mode", "text")
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as c:
            r = await c.get(url, headers={"User-Agent": "AgentForge/2.0"})
        if mode == "json":
            try:
                return json.dumps(r.json(), indent=2)[:5000]
            except Exception:
                return r.text[:3000]
        text = r.text
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.S)
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.S)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:5000]
    except Exception as e:
        return f"Failed to fetch {url}: {e}"
