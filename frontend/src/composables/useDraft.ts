import { watch, ref, type Ref } from 'vue'
import type { ImageItem } from '../types/session'

const DRAFT_PREFIX = 'mcp_draft_'

interface DraftData {
  text: string
  images: ImageItem[]
}

function draftKey(sessionId: string | null): string | null {
  if (!sessionId) return null
  return `${DRAFT_PREFIX}${sessionId}`
}

export function useDraft(
  sessionId: Ref<string | null>,
  text: Ref<string>,
  images: Ref<ImageItem[]>,
) {
  // When false, auto-save watcher is suppressed (during reset or load cycles)
  const enabled = ref(true)

  function load() {
    const key = draftKey(sessionId.value)
    if (!key) return
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const draft: DraftData = JSON.parse(raw)
      enabled.value = false
      if (draft.text !== undefined) text.value = draft.text
      if (draft.images?.length) images.value = draft.images
      // Re-enable after Vue has flushed reactive updates
      setTimeout(() => { enabled.value = true }, 50)
    } catch {
      // ignore malformed draft
    }
  }

  function save() {
    if (!enabled.value) return
    const key = draftKey(sessionId.value)
    if (!key) return
    try {
      const draft: DraftData = { text: text.value, images: images.value }
      localStorage.setItem(key, JSON.stringify(draft))
    } catch {
      // ignore quota errors
    }
  }

  function clear() {
    const key = draftKey(sessionId.value)
    if (!key) return
    localStorage.removeItem(key)
  }

  function pause() { enabled.value = false }
  function resume() { enabled.value = true }

  // Auto-save on every change
  watch([text, images], save, { deep: true })

  return { load, clear, pause, resume }
}
