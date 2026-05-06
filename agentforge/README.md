# AgentForge v2.2 ⚡

**The Agent That Actually Builds.**

AgentForge is a sophisticated autonomous engineering environment that goes beyond simple code suggestions. It operates inside persistent, isolated sandboxes, allowing it to execute commands, install dependencies, and verify its own work before pushing changes.

## 🚀 Key Features

- **Sandbox-First Architecture**: Every session gets a dedicated `/tmp/agentforge` workspace. The agent has full terminal access and awareness of the filesystem.
- **Deep Intelligence**: Support for state-of-the-art models including **DeepSeek R1**, **Groq Compound**, **Qwen 2.5**, and **Grok 4.3**.
- **Autonomous Development**: The agent doesn't just chat; it clones repos, runs build scripts, debugs errors, and manages Git branches.
- **Mandatory Branching**: Protects your `main` branch by automatically creating feature branches (fix/, feat/, refactor/) for all work.
- **Execution Transparency**: Real-time status updates and expandable execution logs with line-change tracking (+/-).

## 🛠 Model Support

### Groq (High Speed)
- Llama 3.3 70B
- Qwen 2.5 32B
- Groq Compound & Compound Mini
- DeepSeek R1 (Distilled)

### xAI (State of the Art)
- Grok 2
- Grok Latest
- Grok 4.3

### OpenRouter
- Claude 3.5 Sonnet
- GPT-4o
- DeepSeek R1 (Full)

## 📦 Deployment

AgentForge is built with **FastAPI** (Backend) and **Next.js** (Frontend).

1. Connect your GitHub account.
2. Add your API keys in Settings.
3. Import a repository or start a fresh sandbox project.
4. Let AgentForge build for you.

---
© 2026 AgentForge. Securely powered by Groq, xAI & GitHub.
