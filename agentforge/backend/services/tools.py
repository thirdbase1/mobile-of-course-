"""
All tools available to the agent.

Each tool: definition (JSON Schema for the model) + async handler.
"""
import httpx, json, base64, os, logging
from sqlalchemy import select
from database import Repo

log = logging.getLogger(__name__)

# ── Tool definitions (sent to the model) ─────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "execute_code",
            "description": "Execute code in a secure sandbox. Supports Python, JavaScript, Bash, C++, Java, Ruby, Rust, TypeScript. Returns stdout, stderr, and exit code.",
            "parameters": {
                "type": "object",
                "properties": {
                    "language": {"type": "string", "description": "Programming language: python, javascript, bash, cpp, java, ruby, rust, typescript"},
                    "code":     {"type": "string", "description": "The code to execute"},
                    "stdin":    {"type": "string", "description": "Optional stdin input for the program", "default": ""},
                },
                "required": ["language", "code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_read_file",
            "description": "Read the contents of a file from a GitHub repository that has been imported by the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo_full_name": {"type": "string", "description": "Owner/repo, e.g. 'octocat/hello-world'"},
                    "path":           {"type": "string", "description": "File path, e.g. 'src/main.py'"},
                    "branch":         {"type": "string", "description": "Branch name, defaults to main"},
                },
                "required": ["repo_full_name", "path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_write_file",
            "description": "Create or update a file in a GitHub repository. Automatically commits with a message.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo_full_name":  {"type": "string"},
                    "path":            {"type": "string", "description": "File path to write"},
                    "content":         {"type": "string", "description": "Full file content"},
                    "commit_message":  {"type": "string", "description": "Git commit message"},
                    "branch":          {"type": "string", "description": "Branch to commit to, defaults to main"},
                },
                "required": ["repo_full_name", "path", "content", "commit_message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "github_list_files",
            "description": "List files and directories in a GitHub repository at a given path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo_full_name": {"type": "string"},
                    "path":           {"type": "string", "description": "Directory path, empty string for root", "default": ""},
                    "branch":         {"type": "string", "default": "main"},
                },
                "required": ["repo_full_name"],
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
                    "repo_full_name": {"type": "string"},
                    "title":          {"type": "string"},
                    "body":           {"type": "string"},
                    "head":           {"type": "string", "description": "Source branch"},
                    "base":           {"type": "string", "description": "Target branch, usually main"},
                },
                "required": ["repo_full_name", "title", "body", "head", "base"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for documentation, error messages, library APIs, or current information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "num_results": {"type": "integer", "description": "Number of results to return (1-10)", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": "Fetch the text content of any URL — useful for reading documentation pages, API references, or JSON endpoints.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url":     {"type": "string"},
                    "extract": {"type": "string", "description": "What to extract: 'text' (default) or 'json'", "default": "text"},
                },
                "required": ["url"],
            },
        },
    },
]


# ── Tool executor ─────────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict, ctx: dict) -> str:
    handlers = {
        "execute_code":      _execute_code,
        "github_read_file":  _github_read_file,
        "github_write_file": _github_write_file,
        "github_list_files": _github_list_files,
        "github_create_pr":  _github_create_pr,
        "web_search":        _web_search,
        "fetch_url":         _fetch_url,
    }
    handler = handlers.get(name)
    if not handler:
        return f"Unknown tool: {name}"
    try:
        return await handler(args, ctx)
    except Exception as e:
        log.exception(f"Tool {name} error")
        return f"Error in {name}: {e}"


# ── Individual tool handlers ──────────────────────────────────────────────────

JUDGE0_BASE     = "https://judge0-ce.p.rapidapi.com"
JUDGE0_LANG_IDS = {
    "python": 71, "python3": 71,
    "javascript": 63, "node": 63,
    "bash": 46, "shell": 46, "sh": 46,
    "cpp": 54, "c++": 54,
    "java": 62,
    "ruby": 72,
    "rust": 73,
    "typescript": 74, "ts": 74,
}

async def _execute_code(args: dict, ctx: dict) -> str:
    import asyncio
    lang     = args.get("language", "python").lower().strip()
    code     = args.get("code", "")
    stdin    = args.get("stdin", "")
    lang_id  = JUDGE0_LANG_IDS.get(lang)
    key      = ctx.get("judge0_key") or os.getenv("JUDGE0_API_KEY", "")

    if not lang_id:
        return f"Unsupported language: {lang}"
    if not key:
        return (
            "Code execution requires a Judge0 API key.\n"
            "Go to Settings and add your Judge0 key (free at rapidapi.com/judge0-official/api/judge0-ce)."
        )

    headers = {
        "X-RapidAPI-Key":  key,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Content-Type":    "application/json",
    }
    payload = {
        "language_id":    lang_id,
        "source_code":    base64.b64encode(code.encode()).decode(),
        "stdin":          base64.b64encode(stdin.encode()).decode(),
        "cpu_time_limit": 15,
        "memory_limit":   131072,
        "enable_network": False,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{JUDGE0_BASE}/submissions?base64_encoded=true&wait=false",
            json=payload, headers=headers,
        )
        if r.status_code not in (200, 201):
            return f"Judge0 error: {r.text}"
        token = r.json().get("token")
        if not token:
            return "No token from Judge0"

        for _ in range(20):
            await asyncio.sleep(1.5)
            res = await client.get(
                f"{JUDGE0_BASE}/submissions/{token}?base64_encoded=true",
                headers=headers,
            )
            data = res.json()
            if data.get("status", {}).get("id", 0) > 2:
                def dec(v):
                    if not v: return ""
                    try: return base64.b64decode(v).decode("utf-8", errors="replace")
                    except: return v
                stdout = dec(data.get("stdout"))
                stderr = dec(data.get("stderr")) or dec(data.get("compile_output"))
                status = data.get("status", {}).get("description", "")
                parts  = []
                if stdout: parts.append(f"STDOUT:\n{stdout}")
                if stderr: parts.append(f"STDERR:\n{stderr}")
                parts.append(f"Status: {status} | Exit: {data.get('exit_code', '?')} | Time: {data.get('time', '?')}s")
                return "\n".join(parts) or "(no output)"

    return "Execution timed out (>30s)"


async def _github_read_file(args: dict, ctx: dict) -> str:
    token = ctx.get("github_token")
    if not token: return "No GitHub token available"
    repo  = args.get("repo_full_name", "")
    path  = args.get("path", "")
    ref   = args.get("branch", "main")
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"https://api.github.com/repos/{repo}/contents/{path}",
            params={"ref": ref},
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
        )
    if r.status_code != 200:
        return f"Error reading file ({r.status_code}): {r.text[:300]}"
    data = r.json()
    if isinstance(data, list):
        return "Path is a directory. Use github_list_files instead."
    content = base64.b64decode(data.get("content", "")).decode("utf-8", errors="replace")
    return f"File: {path}\n```\n{content}\n```"


async def _github_write_file(args: dict, ctx: dict) -> str:
    token   = ctx.get("github_token")
    if not token: return "No GitHub token available"
    repo    = args.get("repo_full_name", "")
    path    = args.get("path", "")
    content = args.get("content", "")
    msg     = args.get("commit_message", "Update via AgentForge")
    branch  = args.get("branch", "main")

    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=15) as client:
        # Get current SHA if file exists (required for updates)
        existing = await client.get(
            f"https://api.github.com/repos/{repo}/contents/{path}",
            params={"ref": branch}, headers=headers,
        )
        sha = existing.json().get("sha") if existing.status_code == 200 else None

        payload = {
            "message": msg,
            "content": base64.b64encode(content.encode()).decode(),
            "branch":  branch,
        }
        if sha: payload["sha"] = sha

        r = await client.put(
            f"https://api.github.com/repos/{repo}/contents/{path}",
            json=payload, headers=headers,
        )
    if r.status_code in (200, 201):
        action = "Updated" if sha else "Created"
        return f"{action} {path} in {repo} on branch {branch}. Commit: {r.json().get('commit', {}).get('sha', '?')[:8]}"
    return f"Error writing file ({r.status_code}): {r.text[:300]}"


async def _github_list_files(args: dict, ctx: dict) -> str:
    token  = ctx.get("github_token")
    if not token: return "No GitHub token"
    repo   = args.get("repo_full_name", "")
    path   = args.get("path", "")
    branch = args.get("branch", "main")
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"https://api.github.com/repos/{repo}/contents/{path}",
            params={"ref": branch},
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
        )
    if r.status_code != 200:
        return f"Error listing files ({r.status_code}): {r.text[:200]}"
    items = r.json()
    if not isinstance(items, list):
        return "Not a directory"
    lines = []
    for item in sorted(items, key=lambda x: (x["type"] != "dir", x["name"])):
        prefix = "📁" if item["type"] == "dir" else "📄"
        lines.append(f"{prefix} {item['name']}")
    return f"Contents of /{path or ''} in {repo}:\n" + "\n".join(lines)


async def _github_create_pr(args: dict, ctx: dict) -> str:
    token = ctx.get("github_token")
    if not token: return "No GitHub token"
    repo  = args.get("repo_full_name", "")
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"https://api.github.com/repos/{repo}/pulls",
            json={
                "title": args.get("title", "AgentForge PR"),
                "body":  args.get("body", ""),
                "head":  args.get("head", ""),
                "base":  args.get("base", "main"),
            },
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
        )
    if r.status_code == 201:
        pr = r.json()
        return f"PR created: {pr.get('html_url')} (#{pr.get('number')})"
    return f"Error creating PR ({r.status_code}): {r.text[:300]}"


async def _web_search(args: dict, ctx: dict) -> str:
    query = args.get("query", "")
    n     = min(args.get("num_results", 5), 10)

    # Try DuckDuckGo Instant Answer API (no key needed)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
            )
        data = r.json()
        results = []
        if data.get("AbstractText"):
            results.append(f"**Summary:** {data['AbstractText']}\n{data.get('AbstractURL', '')}")
        for topic in data.get("RelatedTopics", [])[:n]:
            if isinstance(topic, dict) and topic.get("Text"):
                results.append(f"• {topic['Text']}\n  {topic.get('FirstURL', '')}")
        if results:
            return f"Search results for '{query}':\n\n" + "\n\n".join(results[:n])
    except Exception:
        pass

    return f"Search for '{query}': No results available. Try fetch_url with a specific documentation URL."


async def _fetch_url(args: dict, ctx: dict) -> str:
    url     = args.get("url", "")
    extract = args.get("extract", "text")
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "AgentForge/1.0"})
        if extract == "json":
            return json.dumps(r.json(), indent=2)[:6000]
        # Strip HTML tags simply
        text = r.text
        import re
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.S)
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.S)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:5000]
    except Exception as e:
        return f"Failed to fetch {url}: {e}"
