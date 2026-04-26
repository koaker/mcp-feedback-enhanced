import { ref, onUnmounted } from 'vue'
import { wsManager } from '../api/websocket'

export function useWebSocket() {
  const status = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  const offStatus = wsManager.onStatus((s) => {
    status.value = s
  })

  onUnmounted(() => {
    offStatus()
  })

  function send(msg: Parameters<typeof wsManager.send>[0]) {
    wsManager.send(msg)
  }

  return { status, send, isConnected: () => wsManager.isConnected }
}
