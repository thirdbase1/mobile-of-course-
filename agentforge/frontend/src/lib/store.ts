import { create } from 'zustand'

export const MODELS = [
  { id: 'groq/llama-3.3-70b',    name: 'Llama 3.3 70B',    provider: 'Groq' },
  { id: 'groq/llama-3.1-70b',    name: 'Llama 3.1 70B',    provider: 'Groq' },
  { id: 'openrouter/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'OpenRouter' },
  { id: 'openrouter/gpt-4o',     name: 'GPT-4o',           provider: 'OpenRouter' },
  { id: 'xai/grok-2',            name: 'Grok 2',           provider: 'xAI' },
  { id: 'xai/grok-beta',         name: 'Grok Beta',        provider: 'xAI' },
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
  setSessions:  (sessions) => set({ sessions: sessions.sort((a,b) => b.created_at.localeCompare(a.created_at)) }),
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
