import { create } from 'zustand'

export const MODELS = [
  { id: "groq/llama-3.3-70b",    name: "Llama 3.3 70B",    provider: "Groq" },
  { id: "groq/qwen-32b",         name: "Qwen 2.5 32B",      provider: "Groq" },
  { id: "groq/compound-mini",    name: "Compound Mini",    provider: "Groq" },
  { id: "groq/compound",         name: "Compound",         provider: "Groq" },
  { id: "groq/deepseek-r1-distill-llama-70b", name: "DeepSeek R1 (Llama 70B)", provider: "Groq" },

  { id: "openrouter/grok-3",     name: "Grok 3",           provider: "OpenRouter" },
  { id: "openrouter/grok-2",     name: "Grok 2",           provider: "OpenRouter" },
  { id: "openrouter/deepseek-r1", name: "DeepSeek R1",      provider: "OpenRouter" },
  { id: "openrouter/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter" },
  { id: "openrouter/gpt-4o",     name: "GPT-4o",           provider: "OpenRouter" },
  { id: "openrouter/qwen-32b-reasoning", name: "Qwen 2.5 72B (Reasoning)", provider: "OpenRouter" },
  { id: "openrouter/llama-4-scout", name: "Llama 4 Scout",   provider: "OpenRouter" },
  { id: "openrouter/oss-120b",   name: "GPT OSS 120B",     provider: "OpenRouter" },

  { id: "xai/grok-3",            name: "Grok 3",           provider: "xAI" },
  { id: "xai/grok-2",            name: "Grok 2",           provider: "xAI" },
  { id: "xai/grok-latest",       name: "Grok Latest",      provider: "xAI" },
]

interface State {
  user:         any | null
  setUser:      (u: any) => void
  repos:        any[]
  setRepos:     (rs: any[]) => void
  sessions:     any[]
  setSessions:  (ss: any[]) => void
  upsertSession:(s: any) => void
  removeSession:(id: string) => void
  sidebarOpen:  boolean
  setSidebar:   (o: boolean) => void
  model:        string
  setModel:     (m: string) => void
}

export const useStore = create<State>((set) => ({
  user:         null,
  setUser:      (user) => set({ user }),
  repos:        [],
  setRepos:     (repos) => set({ repos }),
  sessions:     [],
  setSessions:  (sessions) => set({ sessions: sessions.sort((a,b) => (b.created_at || "").localeCompare(a.created_at || "")) }),
  upsertSession:(s) => set((state) => {
    const exists = state.sessions.find((ss) => ss.id === s.id)
    if (exists) return { sessions: state.sessions.map((ss) => (ss.id === s.id ? s : ss)) }
    return { sessions: [s, ...state.sessions] }
  }),
  removeSession:(id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
  sidebarOpen:  true,
  setSidebar:   (sidebarOpen) => set({ sidebarOpen }),
  model:        'groq/llama-3.3-70b',
  setModel:     (model) => set({ model }),
}))
