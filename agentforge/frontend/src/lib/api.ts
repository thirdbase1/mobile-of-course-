import axios from 'axios'

const BASE = '/api/backend'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('af_token')
}

export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const t = getToken()
  if (t) cfg.headers['Authorization'] = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('af_token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────────────────────────
export const getMe = () => api.get('/auth/me').then(r => r.data)

// ── Sessions ─────────────────────────────────────────────────────────────────
export const getSessions    = ()           => api.get('/sessions').then(r => r.data)
export const createSession  = (body: any)  => api.post('/sessions', body).then(r => r.data)
export const getSession     = (id: string) => api.get(`/sessions/${id}`).then(r => r.data)
export const deleteSession  = (id: string) => api.delete(`/sessions/${id}`).then(r => r.data)

// ── Messages ──────────────────────────────────────────────────────────────────
export const getMessages    = (sid: string) => api.get(`/sessions/${sid}/messages`).then(r => r.data)
export const sendMessage    = (sid: string, content: string, model: string) =>
  api.post(`/sessions/${sid}/messages`, { content, model }).then(r => r.data)

// ── Repos ─────────────────────────────────────────────────────────────────────
export const getRepos       = ()           => api.get('/repos').then(r => r.data)
export const importRepo     = (body: any)  => api.post('/repos/import', body).then(r => r.data)
export const getFiles       = (rid: string, path = '') =>
  api.get(`/repos/${rid}/files`, { params: { path } }).then(r => r.data)
export const getFileContent = (rid: string, path: string) =>
  api.get(`/repos/${rid}/file`, { params: { path } }).then(r => r.data)

// ── Execution ─────────────────────────────────────────────────────────────────
export const runCode = (body: { language: string; code: string; stdin?: string }) =>
  api.post('/execute', body).then(r => r.data)

// ── WebSocket helper ──────────────────────────────────────────────────────────
export function openAgentSocket(sessionId: string): WebSocket {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host  = window.location.host
  const token = getToken()
  return new WebSocket(`${proto}://${host}/api/backend/ws/agent/${sessionId}?token=${token}`)
}
