import { create } from 'zustand'

export type Model = 'groq/llama-3.3-70b' | 'openrouter/claude-3.5-sonnet' | 'openrouter/gpt-4o' | 'groq/mixtral-8x7b' | 'xai/grok-2'

export type MsgRole = 'user' | 'assistant' | 'tool' | 'system'

export interface Message {
  id: string
  role: MsgRole
  content: string
  tool_name?: string
  tool_input?: any
  tool_output?: any
  created_at: string
  thinking?: boolean
}

export interface Session {
  id: string
  title: string
  model: Model
  repo_id?: string
  created_at: string
  message_count: number
  status: 'idle' | 'running' | 'error'
}

export interface Repo {
  id: string
  name: string
  full_name: string
  private: boolean
  default_branch: string
  language?: string
  imported_at: string
}

interface AppState {
  user: any | null
  setUser: (u: any) => void

  sessions: Session[]
  setSessions: (s: Session[]) => void
  activeSession: Session | null
  setActiveSession: (s: Session | null) => void
  updateSession: (id: string, patch: Partial<Session>) => void

  messages: Message[]
  setMessages: (m: Message[]) => void
  appendMessage: (m: Message) => void
  updateLastMessage: (patch: Partial<Message>) => void

  repos: Repo[]
  setRepos: (r: Repo[]) => void

  selectedModel: Model
  setSelectedModel: (m: Model) => void

  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  setUser: u => set({ user: u }),

  sessions: [],
  setSessions: s => set({ sessions: s }),
  activeSession: null,
  setActiveSession: s => set({ activeSession: s }),
  updateSession: (id, patch) => set(state => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...patch } : s),
    activeSession: state.activeSession?.id === id
      ? { ...state.activeSession, ...patch } : state.activeSession,
  })),

  messages: [],
  setMessages: m => set({ messages: m }),
  appendMessage: m => set(state => ({ messages: [...state.messages, m] })),
  updateLastMessage: patch => set(state => {
    const msgs = [...state.messages]
    if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...patch }
    return { messages: msgs }
  }),

  repos: [],
  setRepos: r => set({ repos: r }),

  selectedModel: 'groq/llama-3.3-70b',
  setSelectedModel: m => set({ selectedModel: m }),

  sidebarOpen: true,
  setSidebarOpen: v => set({ sidebarOpen: v }),
}))

export const MODELS: { id: Model; label: string; provider: string; fast: boolean }[] = [
  { id: 'groq/llama-3.3-70b',           label: 'LLaMA 3.3 70B',    provider: 'Groq',       fast: true  },
  { id: 'groq/mixtral-8x7b',            label: 'Mixtral 8x7B',      provider: 'Groq',       fast: true  },
  { id: 'openrouter/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'OpenRouter',  fast: false },
  { id: 'openrouter/gpt-4o',            label: 'GPT-4o',            provider: 'OpenRouter',  fast: false },
  { id: 'xai/grok-2',                   label: 'Grok-2',            provider: 'xAI',         fast: false },
]
