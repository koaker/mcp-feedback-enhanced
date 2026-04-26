import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { wsManager } from '../api/websocket'

export function useAutoSubmit(onSubmit: () => void) {
  const settingsStore = useSettingsStore()
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    if (!settingsStore.settings.autoSubmitEnabled) return
    remaining.value = settingsStore.settings.autoSubmitSeconds ?? 30
    stop()
    timer = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) {
        stop()
        onSubmit()
      }
    }, 1000)
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null }
    remaining.value = 0
  }

  function reset() {
    stop()
    start()
  }

  return { remaining, start, stop, reset }
}

export function useTimeout() {
  const settingsStore = useSettingsStore()

  function syncToServer() {
    const enabled = settingsStore.settings.timeoutEnabled ?? false
    const seconds = settingsStore.settings.timeoutSeconds ?? 3600
    wsManager.send({
      type: 'update_timeout_settings',
      settings: { enabled, seconds },
    })
  }

  function triggerUserTimeout() {
    wsManager.send({ type: 'user_timeout' })
  }

  return { syncToServer, triggerUserTimeout }
}
