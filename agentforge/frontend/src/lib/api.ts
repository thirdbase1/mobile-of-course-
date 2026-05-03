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

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('af_token')
    window.location.href = '/'
  }
  return Promise.reject(err)
})

// Auth
export const getMe        = ()  => api.get('/auth/me').then(r => r.data)

// Sessions
export const getSessions  = ()          => api.get('/sessions').then(r => r.data)
export const createSession= (b: any)    => api.post('/sessions', b).then(r => r.data)
export const getSession   = (id: string)=> api.get(`/sessions/${id}`).then(r => r.data)
export const patchSession = (id: string, b: any) => api.patch(`/sessions/${id}`, b).then(r => r.data)
export const deleteSession= (id: string)=> api.delete(`/sessions/${id}`).then(r => r.data)

// Messages
export const getMessages  = (sid: string) => api.get(`/sessions/${sid}/messages`).then(r => r.data)

// Repos
export const getRepos     = ()         => api.get('/repos').then(r => r.data)
export const getGithubRepos=()         => api.get('/repos/github').then(r => r.data)
export const importRepo   = (b: any)   => api.post('/repos/import', b).then(r => r.data)
export const deleteRepo   = (id: string) => api.delete(`/repos/${id}`).then(r => r.data)
export const listFiles    = (rid: string, path = '', ref = '') =>
  api.get(`/repos/${rid}/files`, { params: { path, ref } }).then(r => r.data)
export const getFile      = (rid: string, path: string, ref = '') =>
  api.get(`/repos/${rid}/file`, { params: { path, ref } }).then(r => r.data)
export const writeFile    = (rid: string, b: any) => api.post(`/repos/${rid}/file`, b).then(r => r.data)
export const deleteFile   = (rid: string, path: string, sha: string, branch: string) =>
  api.delete(`/repos/${rid}/file`, { params: { path, sha, branch } }).then(r => r.data)
export const getBranches  = (rid: string) => api.get(`/repos/${rid}/branches`).then(r => r.data)
export const createPR     = (rid: string, b: any) => api.post(`/repos/${rid}/pulls`, b).then(r => r.data)

// Execute
export const runCode = (b: any) => api.post('/execute', b).then(r => r.data)

// Settings
export const getKeys  = () => api.get('/settings/keys').then(r => r.data)
export const saveKeys = (b: any) => api.post('/settings/keys', b).then(r => r.data)

// WebSocket
export function openAgentSocket(sessionId: string): WebSocket {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host  = window.location.host
  const token = getToken()
  return new WebSocket(`${proto}://${host}/api/backend/ws/agent/${sessionId}?token=${token}`)
}
