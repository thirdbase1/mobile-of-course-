import { create } from 'zustand'

export type ModelId =
  | 'groq/llama-3.3-70b'
  | 'groq/mixtral-8x7b'
  | 'groq/llama-3.1-8b'
  | 'openrouter/claude-3.5-sonnet'
  | 'openrouter/gpt-4o'
  | 'openrouter/deepseek-r1'
  | 'xai/grok-2'

export interface Model {
  id:       ModelId
  label:    string
  provider: string
  badge:    string        // speed/quality badge
  tools:    boolean       // supports tool calling
}

export const MODELS: Model[] = [
  { id: 'groq/llama-3.3-70b',           label: 'LLaMA 3.3 70B',    provider: 'Groq',       badge: 'Fast',    tools: true },
  { id: 'groq/mixtral-8x7b',            label: 'Mixtral 8x7B',      provider: 'Groq',       badge: 'Fast',    tools: true },
  { id: 'groq/llama-3.1-8b',            label: 'LLaMA 3.1 8B',      provider: 'Groq',       badge: 'Fastest', tools: true },
  { id: 'openrouter/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'OpenRouter',  badge: 'Smart',   tools: true },
  { id: 'openrouter/gpt-4o',            label: 'GPT-4o',            provider: 'OpenRouter',  badge: 'Smart',   tools: true },
  { id: 'openrouter/deepseek-r1',       label: 'DeepSeek R1',       provider: 'OpenRouter',  badge: 'Reason',  tools: false },
  { id: 'xai/grok-2',                   label: 'Grok-2',            provider: 'xAI',         badge: 'Grok',    tools: true },
]

export type MsgRole = 'user' | 'assistant' | 'tool_call' | 'tool_result'

export interface ChatMessage {
  id:          string
  role:        MsgRole
  content?:    string
  tool_name?:  string
  tool_call_id?: string
  tool_input?: any
  tool_output?: string
  created_at:  string
  streaming?:  boolean   // is this message currently being streamed?
  thinking?:   boolean   // show thinking indicator
  error?:      string    // error message if something went wrong
}

export interface Session {
  id:            string
  title:         string
  model:         ModelId
  repo_id?:      string
  repo?:         { id: string; full_name: string; default_branch: string } | null
  status:        'idle' | 'running' | 'error'
  created_at:    string
  updated_at:    string
  message_count: number
}

export interface Repo {
  id:             string
  full_name:      string
  name:           string
  private:        boolean
  default_branch: string
  language?:      string
  description?:   string
  imported_at:    string
}

interface State {
  // Auth
  user:    any | null
  setUser: (u: any) => void

  // Sessions
  sessions:         Session[]
  setSessions:      (s: Session[]) => void
  upsertSession:    (s: Session) => void
  removeSession:    (id: string) => void
  updateSession:    (id: string, patch: Partial<Session>) => void

  // Active session messages
  messages:             ChatMessage[]
  setMessages:          (m: ChatMessage[]) => void
  appendMessage:        (m: ChatMessage) => void
  updateMessage:        (id: string, patch: Partial<ChatMessage>) => void
  removeMessage:        (id: string) => void

  // Repos
  repos:    Repo[]
  setRepos: (r: Repo[]) => void
  addRepo:  (r: Repo) => void
  removeRepo: (id: string) => void

  // UI
  model:         ModelId
  setModel:      (m: ModelId) => void
  sidebarOpen:   boolean
  setSidebar:    (v: boolean) => void
  editorOpen:    boolean
  setEditorOpen: (v: boolean) => void
  editorWidth:   number
  setEditorWidth:(v: number) => void

  // Editor state
  openFile:       { repoId: string; repoFull: string; path: string; content: string; sha?: string; branch: string } | null
  setOpenFile:    (f: State['openFile']) => void
  openFileTabs:   Array<{ repoId: string; repoFull: string; path: string; content: string; sha?: string; branch: string; dirty?: boolean }>
  setOpenFileTabs:(t: State['openFileTabs']) => void
  openTab:        (f: NonNullable<State['openFile']>) => void
  closeTab:       (path: string) => void
}

export const useStore = create<State>((set, get) => ({
  user:    null,
  setUser: u => set({ user: u }),

  sessions:      [],
  setSessions:   s => set({ sessions: s }),
  upsertSession: s => set(st => ({
    sessions: st.sessions.some(x => x.id === s.id)
      ? st.sessions.map(x => x.id === s.id ? s : x)
      : [s, ...st.sessions],
  })),
  removeSession: id => set(st => ({ sessions: st.sessions.filter(s => s.id !== id) })),
  updateSession: (id, patch) => set(st => ({
    sessions: st.sessions.map(s => s.id === id ? { ...s, ...patch } : s),
  })),

  messages:      [],
  setMessages:   m => set({ messages: m }),
  appendMessage: m => set(st => ({ messages: [...st.messages, m] })),
  updateMessage: (id, patch) => set(st => ({
    messages: st.messages.map(m => m.id === id ? { ...m, ...patch } : m),
  })),
  removeMessage: id => set(st => ({ messages: st.messages.filter(m => m.id !== id) })),

  repos:     [],
  setRepos:  r => set({ repos: r }),
  addRepo:   r => set(st => ({ repos: [r, ...st.repos.filter(x => x.id !== r.id)] })),
  removeRepo: id => set(st => ({ repos: st.repos.filter(r => r.id !== id) })),

  model:         'groq/llama-3.3-70b',
  setModel:      m => set({ model: m }),
  sidebarOpen:   true,
  setSidebar:    v => set({ sidebarOpen: v }),
  editorOpen:    false,
  setEditorOpen: v => set({ editorOpen: v }),
  editorWidth:   420,
  setEditorWidth: v => set({ editorWidth: v }),

  openFile:     null,
  setOpenFile:  f => set({ openFile: f }),
  openFileTabs: [],
  setOpenFileTabs: t => set({ openFileTabs: t }),
  openTab: f => set(st => {
    const exists = st.openFileTabs.find(t => t.path === f.path && t.repoId === f.repoId)
    const tabs   = exists
      ? st.openFileTabs.map(t => t.path === f.path && t.repoId === f.repoId ? f : t)
      : [...st.openFileTabs, f]
    return { openFileTabs: tabs, openFile: f, editorOpen: true }
  }),
  closeTab: path => set(st => {
    const tabs = st.openFileTabs.filter(t => t.path !== path)
    const cur  = st.openFile?.path === path ? (tabs[tabs.length - 1] ?? null) : st.openFile
    return { openFileTabs: tabs, openFile: cur }
  }),
}))
