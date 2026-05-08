import { create } from 'zustand'

export const MODELS = [
  // GROQ
  { id: "groq/llama-3.3-70b-versatile",    name: "Llama 3.3 70B Versatile",    provider: "Groq" },
  { id: "groq/llama-3.1-70b-versatile",    name: "Llama 3.1 70B Versatile",    provider: "Groq" },
  { id: "groq/llama-3.1-8b-instant",       name: "Llama 3.1 8B Instant",       provider: "Groq" },
  { id: "groq/mixtral-8x7b-32768",         name: "Mixtral 8x7B",               provider: "Groq" },
  { id: "groq/deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", provider: "Groq" },
  { id: "groq/qwen-2.5-32b",               name: "Qwen 2.5 32B",               provider: "Groq" },
  { id: "groq/gpt-4o-mini",                name: "GPT-4o Mini",                provider: "Groq" },
  { id: "groq/llama-guard-3-8b",           name: "Llama Guard 3 8B",           provider: "Groq" },
  { id: "groq/gemma2-9b-it",               name: "Gemma2 9B IT",               provider: "Groq" },
  { id: "groq/compound",                   name: "Compound",                   provider: "Groq" },
  { id: "groq/compound-mini",              name: "Compound Mini",              provider: "Groq" },

  // OPENROUTER - Free Models
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B Instruct (Free)", provider: "OpenRouter" },
  { id: "meta-llama/llama-3.1-405b-instruct:free", name: "Llama 3.1 405B Instruct (Free)", provider: "OpenRouter" },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)", provider: "OpenRouter" },
  { id: "minimax/minimax-m2.5:free", name: "Minimax 2.5 (Free)", provider: "OpenRouter" },
  { id: "qwen/qwen3-coder:free", name: "Qwen 3 Coder (Free)", provider: "OpenRouter" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen 3 Next 80B (Free)", provider: "OpenRouter" },
  { id: "google/gemma-4-26b-a4b-it:free", name: "Gemma 4 26B (Free)", provider: "OpenRouter" },
  { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B (Free)", provider: "OpenRouter" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super 120B (Free)", provider: "OpenRouter" },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B (Free)", provider: "OpenRouter" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "Nemotron 3 Nano Omni 30B (Free)", provider: "OpenRouter" },
  { id: "baidu/cobuddy:free", name: "CoBuddy (Free)", provider: "OpenRouter" },
  { id: "baidu/qianfan-ocr-fast:free", name: "Qianfan OCR Fast (Free)", provider: "OpenRouter" },
  { id: "poolside/laguna-m.1:free", name: "Laguna M.1 (Free)", provider: "OpenRouter" },
  { id: "poolside/laguna-xs.2:free", name: "Laguna XS.2 (Free)", provider: "OpenRouter" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (Free)", provider: "OpenRouter" },
  { id: "liquid/lfm-2.5-1.2b-thinking:free", name: "LFM 2.5 1.2B Thinking (Free)", provider: "OpenRouter" },
  { id: "openai/gpt-oss-120b:free", name: "GPT OSS 120B (Free)", provider: "OpenRouter" },
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B (Free)", provider: "OpenRouter" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 Llama 405B (Free)", provider: "OpenRouter" },
  { id: "openrouter/owl-alpha", name: "Owl Alpha", provider: "OpenRouter" },
  
  // OPENROUTER - Paid Models
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", provider: "OpenRouter" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenRouter" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenRouter" },
  { id: "inclusionai/ring-2.6-1t:free", name: "Ring 2.6 1T (Free)", provider: "OpenRouter" },

  // xAI
  { id: "grok-4.3", name: "Grok 4.3", provider: "xAI" },
  { id: "grok-4.1", name: "Grok 4.1", provider: "xAI" },
  { id: "grok-3", name: "Grok 3", provider: "xAI" },
]

interface State {
  user: any | null; setUser: (u: any) => void;
  repos: any[]; setRepos: (rs: any[]) => void;
  sessions: any[]; setSessions: (ss: any[]) => void;
  upsertSession:(s: any) => void; removeSession:(id: string) => void;
  sidebarOpen: boolean; setSidebar: (o: boolean) => void;
  model: string; setModel: (m: string) => void;
}

export const useStore = create<State>((set) => ({
  user: null, setUser: (user) => set({ user }),
  repos: [], setRepos: (repos) => set({ repos }),
  sessions: [], setSessions: (sessions) => set({ sessions: sessions.sort((a,b) => (b.created_at || "").localeCompare(a.created_at || "")) }),
  upsertSession:(s) => set((state) => {
    const exists = state.sessions.find((ss) => ss.id === s.id)
    if (exists) return { sessions: state.sessions.map((ss) => (ss.id === s.id ? s : ss)) }
    return { sessions: [s, ...state.sessions] }
  }),
  removeSession:(id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
  sidebarOpen: true, setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  model: 'groq/llama-3.3-70b-versatile', setModel: (model) => set({ model }),
}))
