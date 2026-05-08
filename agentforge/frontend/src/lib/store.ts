import { create } from 'zustand'

export const MODELS = [
  // GROQ
  { id: "groq/llama-3.3-70b",    name: "Llama 3.3 70B",    provider: "Groq" },
  { id: "groq/llama-3.1-70b",    name: "Llama 3.1 70B",    provider: "Groq" },
  { id: "groq/llama-3.1-8b",     name: "Llama 3.1 8B",     provider: "Groq" },
  { id: "groq/mixtral-8x7b",     name: "Mixtral 8x7B",     provider: "Groq" },
  { id: "groq/deepseek-r1",      name: "DeepSeek R1",      provider: "Groq" },
  { id: "groq/qwen-2.5-32b",     name: "Qwen 2.5 32B",      provider: "Groq" },
  { id: "groq/qwen-3-32b",       name: "Qwen 3 32B",        provider: "Groq" },
  { id: "groq/gpt-oss-120b",     name: "GPT OSS 120B",      provider: "Groq" },
  { id: "groq/gpt-oss-20b",      name: "GPT OSS 20B",       provider: "Groq" },
  { id: "groq/llama-4-scout",    name: "Llama 4 Scout",     provider: "Groq" },
  { id: "groq/compound-mini",    name: "Compound Mini",     provider: "Groq" },
  { id: "groq/compound",         name: "Compound",          provider: "Groq" },

  // OPENROUTER
  { id: "openrouter/grok-3",     name: "Grok 3",           provider: "OpenRouter" },
  { id: "openrouter/nemotron-3-super", name: "Nemotron 3 Super 120B", provider: "OpenRouter" },
  { id: "openrouter/owl-alpha",  name: "Owl Alpha",        provider: "OpenRouter" },
  { id: "openrouter/qianfan-ocr", name: "Qianfan OCR Fast", provider: "OpenRouter" },
  { id: "openrouter/laguna-m1",  name: "Laguna M.1",       provider: "OpenRouter" },
  { id: "openrouter/laguna-xs2", name: "Laguna XS.2",      provider: "OpenRouter" },
  { id: "openrouter/cobuddy",    name: "CoBuddy",          provider: "OpenRouter" },
  { id: "openrouter/qwen3-coder", name: "Qwen 3 Coder",     provider: "OpenRouter" },
  { id: "openrouter/minimax-m2.5", name: "Minimax M2.5",    provider: "OpenRouter" },
  { id: "openrouter/glm-4.5-air", name: "GLM 4.5 Air",      provider: "OpenRouter" },

  // xAI
  { id: "xai/grok-3",            name: "Grok 3 (Native)",   provider: "xAI" },
  { id: "xai/grok-2",            name: "Grok 2",           provider: "xAI" },
  { id: "xai/grok-latest",       name: "Grok Latest",      provider: "xAI" },
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
  model: 'groq/llama-3.3-70b', setModel: (model) => set({ model }),
}))
