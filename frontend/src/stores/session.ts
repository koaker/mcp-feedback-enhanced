import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, SessionStatus } from '../types/session'
import { api } from '../api/http'
import { wsManager } from '../api/websocket'

export const useSessionStore = defineStore('session', () => {
  const hasSession = ref(false)
  const sessionId = ref<string | null>(null)
  const projectDirectory = ref('')
  const summary = ref('')
  const feedbackCompleted = ref(false)
  const sessionStatus = ref<SessionStatus>('waiting')
  const statusMessage = ref('')
  const allSessions = ref<Session[]>([])
  const commandLogs = ref<string[]>([])
  const wsStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  const isWaiting = computed(() => !hasSession.value)
  const isActive = computed(() => hasSession.value && !feedbackCompleted.value)

  async function fetchStatus() {
    try {
      const data = await api.getSessionStatus()
      hasSession.value = data.has_session
      if (data.session_info) {
        projectDirectory.value = data.session_info.project_directory
        summary.value = data.session_info.summary
        feedbackCompleted.value = data.session_info.feedback_completed
      }
    } catch (e) {
      console.error('[Session] fetchStatus failed', e)
    }
  }

  async function fetchCurrentSession() {
    try {
      const data = await api.getCurrentSession()
      sessionId.value = data.session_id
      projectDirectory.value = data.project_directory
      summary.value = data.summary
      feedbackCompleted.value = data.feedback_completed
      commandLogs.value = data.command_logs
      hasSession.value = true
    } catch {
      hasSession.value = false
    }
  }

  async function fetchAllSessions() {
    try {
      const data = await api.getAllSessions()
      allSessions.value = data.sessions as Session[]
    } catch (e) {
      console.error('[Session] fetchAllSessions failed', e)
    }
  }

  function updateFromWS(info: {
    status: string
    message: string
    feedback_completed: boolean
    project_directory: string
    summary: string
    session_id: string
  }) {
    sessionStatus.value = info.status as SessionStatus
    statusMessage.value = info.message
    feedbackCompleted.value = info.feedback_completed
    projectDirectory.value = info.project_directory
    summary.value = info.summary
    sessionId.value = info.session_id
    hasSession.value = true
  }

  function setNewSession(info: { session_id: string; project_directory: string; summary: string }) {
    sessionId.value = info.session_id
    projectDirectory.value = info.project_directory
    summary.value = info.summary
    feedbackCompleted.value = false
    hasSession.value = true
    commandLogs.value = []
    sessionStatus.value = 'waiting'
  }

  function appendCommandLog(line: string) {
    commandLogs.value.push(line)
  }

  function clearCommandLogs() {
    commandLogs.value = []
  }

  function setWsStatus(s: typeof wsStatus.value) {
    wsStatus.value = s
  }

  // 初始化 WebSocket 监听
  function initWebSocket() {
    wsManager.onStatus(setWsStatus)
    wsManager.onMessage((msg) => {
      if (msg.type === 'status_update') {
        updateFromWS(msg.status_info)
      } else if (msg.type === 'session_updated' && msg.action === 'new_session_created') {
        setNewSession(msg.session_info)
      } else if (msg.type === 'command_output') {
        appendCommandLog(msg.output)
      } else if (msg.type === 'command_complete') {
        appendCommandLog(`\n[进程已退出，退出码: ${msg.exit_code}]`)
      } else if (msg.type === 'command_error') {
        appendCommandLog(`\n[错误: ${msg.error}]`)
      }
    })
    wsManager.connect()
  }

  return {
    hasSession, sessionId, projectDirectory, summary,
    feedbackCompleted, sessionStatus, statusMessage,
    allSessions, commandLogs, wsStatus,
    isWaiting, isActive,
    fetchStatus, fetchCurrentSession, fetchAllSessions,
    updateFromWS, setNewSession, appendCommandLog, clearCommandLogs,
    setWsStatus, initWebSocket,
  }
})
