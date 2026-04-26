import type { Settings, SessionHistoryData } from '../types/api'

const BASE = ''

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(`HTTP ${res.status}`), err)
  }
  return res.json()
}

export const api = {
  // Translations
  getTranslations: () => get<Record<string, Record<string, unknown>>>('/api/translations'),

  // Session
  getSessionStatus: () => get<{
    has_session: boolean
    status: string
    session_info?: { project_directory: string; summary: string; feedback_completed: boolean }
    messageCode?: string
  }>('/api/session-status'),

  getCurrentSession: () => get<{
    session_id: string
    project_directory: string
    summary: string
    feedback_completed: boolean
    command_logs: string[]
    images_count: number
  }>('/api/current-session'),

  getAllSessions: () => get<{ sessions: unknown[] }>('/api/all-sessions'),

  addUserMessage: (data: { content: string; images?: unknown[]; submission_method?: string }) =>
    post('/api/add-user-message', data),

  // Settings
  saveSettings: (settings: Settings) => post('/api/save-settings', settings),
  loadSettings: () => get<Settings>('/api/load-settings'),
  clearSettings: () => post('/api/clear-settings'),

  // Session history
  loadSessionHistory: () => get<SessionHistoryData>('/api/load-session-history'),
  saveSessionHistory: (data: SessionHistoryData) => post('/api/save-session-history', data),

  // Log level
  getLogLevel: () => get<{ logLevel: string }>('/api/log-level'),
  setLogLevel: (logLevel: string) => post('/api/log-level', { logLevel }),
}
