import { ref, onUnmounted } from 'vue'
import { useI18nStore } from '../stores/i18n'

export function useNotification() {
  const i18n = useI18nStore()

  interface Toast {
    id: number
    message: string
    severity: 'success' | 'warning' | 'error' | 'info'
  }

  const toasts = ref<Toast[]>([])
  let counter = 0
  const timers: Map<number, ReturnType<typeof setTimeout>> = new Map()

  function show(message: string, severity: Toast['severity'] = 'info', duration = 4000) {
    const id = ++counter
    toasts.value.push({ id, message, severity })

    const t = setTimeout(() => remove(id), duration)
    timers.set(id, t)

    return id
  }

  function remove(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
    const t = timers.get(id)
    if (t) { clearTimeout(t); timers.delete(id) }
  }

  function showFromCode(code: string, severity: Toast['severity'] = 'info') {
    const message = i18n.t(`notifications.${code}`) || code
    show(message, severity)
  }

  onUnmounted(() => {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
  })

  return { toasts, show, remove, showFromCode }
}
