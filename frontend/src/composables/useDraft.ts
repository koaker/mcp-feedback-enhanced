import { watch, type Ref } from 'vue'
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
  function load() {
    const key = draftKey(sessionId.value)
    if (!key) return
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const draft: DraftData = JSON.parse(raw)
      if (draft.text) text.value = draft.text
      if (draft.images?.length) images.value = draft.images
    } catch {
      // ignore malformed draft
    }
  }

  function save() {
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

  // Auto-save on every change
  watch([text, images], save, { deep: true })

  // Load draft when sessionId changes
  watch(sessionId, (newId, oldId) => {
    // Clear old session draft only if it was a different session
    if (oldId && oldId !== newId) {
      const oldKey = draftKey(oldId)
      if (oldKey) localStorage.removeItem(oldKey)
    }
    if (newId) load()
  })

  return { load, clear }
}
