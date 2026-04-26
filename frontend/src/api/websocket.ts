import type { ServerMessage, ClientMessage } from '../types/websocket'

type MessageHandler = (msg: ServerMessage) => void
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void

const HEARTBEAT_INTERVAL = 30_000
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_BASE_DELAY = 1000

export class WebSocketManager {
  private ws: WebSocket | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private destroyed = false

  private messageHandlers: Set<MessageHandler> = new Set()
  private statusHandlers: Set<StatusHandler> = new Set()

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  connect() {
    if (this.destroyed) return
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${location.host}/ws`

    this.emit('connecting')

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.emit('connected')
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage
          // Respond to ping
          if (msg.type === 'ping') {
            this.send({ type: 'pong', timestamp: (msg as { type: 'ping'; timestamp: number }).timestamp })
            return
          }
          this.messageHandlers.forEach((h) => h(msg))
        } catch (e) {
          console.error('[WS] Failed to parse message', e)
        }
      }

      this.ws.onclose = () => {
        this.stopHeartbeat()
        this.emit('disconnected')
        if (!this.destroyed) this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.emit('error')
      }
    } catch (e) {
      console.error('[WS] Failed to create WebSocket', e)
      this.scheduleReconnect()
    }
  }

  send(msg: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  disconnect() {
    this.destroyed = true
    this.stopHeartbeat()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat', timestamp: Date.now() })
    }, HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect() {
    if (this.destroyed) return
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return

    const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** this.reconnectAttempts, 30_000)
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) this.connect()
    }, delay)
  }

  private emit(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
    this.statusHandlers.forEach((h) => h(status))
  }
}

// 全局单例
export const wsManager = new WebSocketManager()
