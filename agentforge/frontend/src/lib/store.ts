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

  // OPENROUTER
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", provider: "OpenRouter" },
  { id: "meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B Instruct", provider: "OpenRouter" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B Instruct", provider: "OpenRouter" },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)", provider: "OpenRouter" },
  { id: "qwen/qwen-max", name: "Qwen Max", provider: "OpenRouter" },
  { id: "qwen/qwen-2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B", provider: "OpenRouter" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", provider: "OpenRouter" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenRouter" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenRouter" },
  { id: "nvidia/nemotron-3-super-120b", name: "Nemotron 3 Super 120B", provider: "OpenRouter" },
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
