import { ref, computed, watch, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useSessionStore } from '../stores/session'
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

/**
 * Countdown timer for the session timeout progress bar.
 * Uses session.created_at (ms) as the start reference so late page opens
 * show accurate remaining time.
 */
export function useTimeoutCountdown() {
  const settingsStore = useSettingsStore()
  const sessionStore = useSessionStore()

  const remainingSeconds = ref(0)
  let ticker: ReturnType<typeof setInterval> | null = null

  function totalSeconds(): number {
    return settingsStore.settings.timeoutSeconds ?? 3600
  }

  function isEnabled(): boolean {
    return settingsStore.settings.timeoutEnabled ?? false
  }

  function tick() {
    if (!isEnabled()) { remainingSeconds.value = 0; return }
    const created = sessionStore.sessionCreatedAt
    if (!created) { remainingSeconds.value = 0; return }
    const elapsed = (Date.now() - created) / 1000
    const left = Math.max(0, totalSeconds() - elapsed)
    remainingSeconds.value = Math.floor(left)
    if (left <= 0 && ticker) {
      clearInterval(ticker)
      ticker = null
    }
  }

  function start() {
    if (ticker) clearInterval(ticker)
    tick()
    ticker = setInterval(tick, 1000)
  }

  function stop() {
    if (ticker) { clearInterval(ticker); ticker = null }
    remainingSeconds.value = 0
  }

  onUnmounted(stop)

  // Progress 0..1 (1 = full, 0 = expired)
  const progress = computed(() => {
    const total = totalSeconds()
    if (!total || !isEnabled()) return 1
    return Math.min(1, Math.max(0, remainingSeconds.value / total))
  })

  // mm:ss formatted string
  const label = computed(() => {
    if (!isEnabled() || remainingSeconds.value <= 0) return ''
    const m = Math.floor(remainingSeconds.value / 60)
    const s = remainingSeconds.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })

  // Turn red in last 30 seconds
  const isUrgent = computed(() => isEnabled() && remainingSeconds.value > 0 && remainingSeconds.value <= 30)

  // Watch for session changes (new session resets the countdown)
  watch(() => sessionStore.sessionCreatedAt, () => {
    if (isEnabled()) start()
  })

  watch(() => settingsStore.settings.timeoutEnabled, (v) => {
    if (v) start(); else stop()
  })

  return { remainingSeconds, progress, label, isUrgent, start, stop }
}
