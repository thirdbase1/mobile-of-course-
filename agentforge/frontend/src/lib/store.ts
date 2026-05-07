import { create } from 'zustand'

export const MODELS = [
  // Groq Models
  { id: "groq/llama-3.3-70b",    name: "Llama 3.3 70B",    provider: "Groq" },
  { id: "groq/qwen-32b",         name: "Qwen 2.5 32B",      provider: "Groq" },
  { id: "groq/groq/compound-mini",    name: "Compound Mini",    provider: "Groq" },
  { id: "groq/groq/compound",         name: "Compound",         provider: "Groq" },
  { id: "groq/deepseek-r1-distill-llama-70b", name: "DeepSeek R1 (Llama 70B)", provider: "Groq" },
  
  // Groq Reasoning Models
  { id: "groq/gpt-oss-120b-reasoning", name: "GPT OSS 120B (Reasoning)", provider: "Groq" },
  { id: "groq/gpt-oss-20b-reasoning",  name: "GPT OSS 20B (Reasoning)",  provider: "Groq" },
  { id: "groq/qwen-3-32b-reasoning",   name: "Qwen 3 32B (Reasoning)",   provider: "Groq" },
  
  // Groq Tool Use Models
  { id: "groq/gpt-oss-120b-tools",     name: "GPT OSS 120B (Tools)",     provider: "Groq" },
  { id: "groq/gpt-oss-20b-tools",      name: "GPT OSS 20B (Tools)",      provider: "Groq" },
  { id: "groq/llama-4-scout-tools",    name: "Llama 4 Scout (Tools)",    provider: "Groq" },
  { id: "groq/qwen-3-32b-tools",       name: "Qwen 3 32B (Tools)",       provider: "Groq" },

  // OpenRouter Models
  { id: "openrouter/grok-3",     name: "Grok 3",           provider: "OpenRouter" },
  { id: "openrouter/grok-2",     name: "Grok 2",           provider: "OpenRouter" },
  { id: "openrouter/deepseek-r1", name: "DeepSeek R1",      provider: "OpenRouter" },
  { id: "openrouter/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter" },
  { id: "openrouter/gpt-4o",     name: "GPT-4o",           provider: "OpenRouter" },
  { id: "openrouter/qwen-32b-reasoning", name: "Qwen 2.5 72B (Reasoning)", provider: "OpenRouter" },
  { id: "openrouter/llama-4-scout", name: "Llama 4 Scout",   provider: "OpenRouter" },
  { id: "openrouter/oss-120b",   name: "GPT OSS 120B",     provider: "OpenRouter" },
  
  // OpenRouter New Models
  { id: "openrouter/nemotron-120b",   name: "Nemotron 3 Super 120B",   provider: "OpenRouter" },
  { id: "openrouter/owl-alpha",       name: "Owl Alpha",                provider: "OpenRouter" },
  { id: "openrouter/qianfan-ocr",     name: "QianFan OCR Fast",        provider: "OpenRouter" },
  { id: "openrouter/laguna-m1",       name: "Laguna M1",                provider: "OpenRouter" },
  { id: "openrouter/laguna-xs2",      name: "Laguna XS2",               provider: "OpenRouter" },
  { id: "openrouter/cobuddy",         name: "CoBuddy",                  provider: "OpenRouter" },
  { id: "openrouter/qwen3-coder",     name: "Qwen 3 Coder",             provider: "OpenRouter" },
  { id: "openrouter/minimax-m25",     name: "Minimax M2.5",             provider: "OpenRouter" },
  { id: "openrouter/glm-45-air",      name: "GLM 4.5 Air",              provider: "OpenRouter" },
  { 
  id: "openrouter/x-ai/grok-code-fast-1",
  name: "Grok Code Fast 1",
  provider: "OpenRouter"
},
  // xAI Models
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
