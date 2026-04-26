<template>
  <div class="history-panel">
    <div class="history-panel__header">
      <h3 class="history-panel__title">{{ i18n.t('history.title') }}</h3>
      <div class="history-panel__header-actions">
        <button class="history-panel__refresh" @click="load" :title="i18n.t('history.refresh')">↻</button>
        <button class="history-panel__close" @click="emit('close')" title="关闭">✕</button>
      </div>
    </div>

    <div v-if="loading" class="history-panel__empty">{{ i18n.t('history.loading') }}</div>
    <div v-else-if="allItems.length === 0" class="history-panel__empty">{{ i18n.t('history.empty') }}</div>

    <div v-else class="history-panel__groups">
      <!-- 当前进程 sessions -->
      <div v-if="currentSessions.length > 0" class="history-panel__group history-panel__group--current">
        <div class="history-panel__group-header" @click="toggleGroup('__current__')">
          <span class="history-panel__group-badge">{{ i18n.t('history.currentSession') }}</span>
          <span class="history-panel__group-count">{{ currentSessions.length }} {{ i18n.t('history.items') }}</span>
          <span class="history-panel__group-chevron">{{ openGroups.has('__current__') ? '▾' : '▸' }}</span>
        </div>
        <transition name="group-content">
          <div v-if="openGroups.has('__current__')" class="history-panel__items">
            <div
              v-for="s in currentSessions"
              :key="s.session_id"
              class="history-panel__item"
              @click="openModal(s, currentSessions)"
            >
              <div class="history-panel__item-summary">{{ truncate(s.summary, 60) }}</div>
              <div class="history-panel__item-meta">
                <span class="history-panel__item-time">{{ formatTime(s.created_at) }}</span>
                <span v-if="s.is_active" class="history-panel__item-status status--active">{{ i18n.t('history.inProgress') }}</span>
                <span v-else class="history-panel__item-status" :class="`status--${s.status}`">{{ s.status }}</span>
                <span v-if="s.images_count > 0" class="history-panel__item-imgs">📷{{ s.images_count }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 磁盘历史分组 -->
      <div v-for="group in diskGroups" :key="group.group_id" class="history-panel__group">
        <div class="history-panel__group-header" @click="toggleGroup(group.group_id)">
          <span class="history-panel__group-date">{{ formatGroupDate(group.started_at) }}</span>
          <span class="history-panel__group-count">{{ (group.sessions || []).length }} {{ i18n.t('history.items') }}</span>
          <span class="history-panel__group-chevron">{{ openGroups.has(group.group_id) ? '▾' : '▸' }}</span>
        </div>
        <transition name="group-content">
          <div v-if="openGroups.has(group.group_id)" class="history-panel__items">
            <div v-if="!(group.sessions || []).length" class="history-panel__empty-group">{{ i18n.t('history.noRecords') }}</div>
            <div
              v-for="s in (group.sessions || [])"
              :key="s.session_id"
              class="history-panel__item"
              @click="openModal(s, group.sessions || [])"
            >
              <div class="history-panel__item-summary">{{ truncate(s.summary, 60) }}</div>
              <div class="history-panel__item-meta">
                <span class="history-panel__item-time">{{ formatTime(s.created_at) }}</span>
                <span class="history-panel__item-status" :class="`status--${s.status}`">{{ s.status }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 详情 Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="modalVisible" class="history-modal-overlay" @click.self="closeModal">
          <div class="history-modal">
            <!-- Modal Header -->
            <div class="history-modal__header">
              <div class="history-modal__nav">
                <button class="history-modal__nav-btn" @click="prevRecord" :disabled="modalIndex <= 0" title="上一条">‹</button>
                <span class="history-modal__nav-count">{{ modalIndex + 1 }} / {{ modalList.length }}</span>
                <button class="history-modal__nav-btn" @click="nextRecord" :disabled="modalIndex >= modalList.length - 1" title="下一条">›</button>
              </div>
              <div class="history-modal__meta">
                <span class="history-modal__time">{{ formatTime(modalItem.created_at) }}</span>
                <span v-if="modalItem.is_active" class="history-panel__item-status status--active">{{ i18n.t('history.inProgress') }}</span>
                <span v-else class="history-panel__item-status" :class="`status--${modalItem.status}`">{{ modalItem.status }}</span>
                <span class="history-modal__dir">{{ modalItem.project_directory }}</span>
              </div>
              <button class="history-modal__close" @click="closeModal">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="history-modal__body">
              <!-- Summary section -->
              <div class="history-modal__section">
                <div class="history-modal__section-label">{{ i18n.t('history.summaryLabel') }}</div>
                <div class="history-modal__markdown" v-html="renderMd(modalItem.summary)"></div>
              </div>

              <!-- Feedback section -->
              <div v-if="modalItem.feedback" class="history-modal__section history-modal__section--feedback">
                <div class="history-modal__section-label">{{ i18n.t('history.feedbackLabel') }}</div>
                <div class="history-modal__feedback-text">{{ modalItem.feedback }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import { useI18nStore } from '../../stores/i18n'

const emit = defineEmits<{ close: [] }>()
const i18n = useI18nStore()

interface SessionRecord {
  session_id: string
  project_directory: string
  summary: string
  feedback: string
  images_count: number
  created_at: number | string
  status: string
  is_active?: boolean
}

interface HistoryGroup {
  group_id: string
  started_at: string
  sessions: SessionRecord[]
}

const loading = ref(false)
const currentSessions = ref<SessionRecord[]>([])
const diskGroups = ref<HistoryGroup[]>([])
const openGroups = ref<Set<string>>(new Set(['__current__']))

// Modal state
const modalVisible = ref(false)
const modalList = ref<SessionRecord[]>([])
const modalIndex = ref(0)
const modalItem = computed(() => modalList.value[modalIndex.value] || {} as SessionRecord)

const allItems = computed(() => [
  ...currentSessions.value,
  ...diskGroups.value.flatMap(g => g.sessions || [])
])

function openModal(s: SessionRecord, list: SessionRecord[]) {
  modalList.value = list
  modalIndex.value = list.findIndex(x => x.session_id === s.session_id)
  if (modalIndex.value < 0) modalIndex.value = 0
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
}

function prevRecord() {
  if (modalIndex.value > 0) modalIndex.value--
}

function nextRecord() {
  if (modalIndex.value < modalList.value.length - 1) modalIndex.value++
}

function handleKeydown(e: KeyboardEvent) {
  if (!modalVisible.value) return
  if (e.key === 'Escape') closeModal()
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevRecord()
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextRecord()
}

onMounted(() => {
  load()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function renderMd(text: string): string {
  if (!text) return ''
  try {
    return marked.parse(text, { async: false }) as string
  } catch {
    return text
  }
}

async function load() {
  loading.value = true
  try {
    // 1. Load current process sessions from all-sessions (always available)
    const allRes = await fetch('/api/all-sessions')
    if (allRes.ok) {
      const allData = await allRes.json()
      currentSessions.value = (allData.sessions || []).map((s: any) => ({
        session_id: s.session_id,
        project_directory: s.project_directory,
        summary: s.summary,
        feedback: s.feedback || '',
        images_count: s.images_count || 0,
        created_at: Math.floor((s.created_at || 0) / 1000), // ms -> s
        status: s.status,
        is_active: s.status === 'waiting' || s.status === 'active',
      })).sort((a: SessionRecord, b: SessionRecord) => (a.created_at as number) - (b.created_at as number))
    }

    // 2. Load disk history groups
    const diskRes = await fetch('/api/load-session-history')
    if (diskRes.ok) {
      const diskData = await diskRes.json()
      diskGroups.value = diskData.groups || []
    }
  } finally {
    loading.value = false
  }
}

function toggleGroup(id: string) {
  if (openGroups.value.has(id)) {
    openGroups.value.delete(id)
  } else {
    openGroups.value.add(id)
  }
}

function truncate(text: string, len: number) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '…' : text
}

function formatTime(ts: number | string) {
  if (!ts) return ''
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatGroupDate(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.history-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.2rem 0.5rem;
  border-bottom: 1px solid var(--border);
}

.history-panel__title {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.history-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.history-panel__refresh,
.history-panel__close {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0 0.4rem;
  cursor: pointer;
  line-height: 1.6;
}
.history-panel__refresh:hover { color: var(--accent-text); }
.history-panel__close:hover { color: var(--text-primary); }

.history-panel__empty {
  padding: 1.5rem 1.2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.history-panel__groups {
  flex: 1;
  overflow-y: auto;
}

.history-panel__group {
  border-bottom: 1px solid var(--border);
}

.history-panel__group--current .history-panel__group-header {
  background: rgba(99, 102, 241, 0.06);
}

.history-panel__group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  user-select: none;
}
.history-panel__group-header:hover { background: var(--bg-elevated); }

.history-panel__group-badge {
  font-size: 0.72rem;
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-text);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-weight: 600;
}

.history-panel__group-date {
  font-size: 0.78rem;
  color: var(--text-secondary);
  flex: 1;
}

.history-panel__group-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.history-panel__group-chevron {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.history-panel__items {
  padding: 0.2rem 0;
}

.history-panel__empty-group {
  padding: 0.5rem 1.2rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.history-panel__item {
  padding: 0.5rem 1.2rem 0.5rem 1.2rem;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.15s, border-left-color 0.15s;
}
.history-panel__item:hover {
  background: var(--bg-elevated);
  border-left-color: var(--accent-text);
}

.history-panel__item-summary {
  color: var(--text-primary);
  font-size: 0.82rem;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-panel__item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.2rem;
}

.history-panel__item-time {
  color: var(--text-muted);
  font-size: 0.73rem;
}

.history-panel__item-status {
  font-size: 0.7rem;
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
  background: rgba(100, 100, 100, 0.2);
  color: var(--text-muted);
}
/* Status badges — readable on both light & dark backgrounds */
.status--completed { background: rgba(16, 185, 129, 0.15); color: #059669; }
.status--feedback_submitted { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
.status--active { background: rgba(245, 158, 11, 0.15); color: #b45309; }
.status--waiting { background: rgba(245, 158, 11, 0.15); color: #b45309; }
.status--error { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
.status--timeout { background: rgba(251, 146, 60, 0.15); color: #c2410c; }

/* Dark mode overrides for status badges */
[data-theme="dark"] .status--completed { color: #86efac; }
[data-theme="dark"] .status--feedback_submitted { color: #93c5fd; }
[data-theme="dark"] .status--active { color: #fde68a; }
[data-theme="dark"] .status--waiting { color: #fde68a; }
[data-theme="dark"] .status--error { color: #fca5a5; }
[data-theme="dark"] .status--timeout { color: #fdba74; }

.history-panel__item-imgs {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Transitions */
.group-content-enter-active, .group-content-leave-active { transition: max-height 0.2s ease, opacity 0.15s ease; max-height: 500px; overflow: hidden; }
.group-content-enter-from, .group-content-leave-to { max-height: 0; opacity: 0; }

/* ===== Modal ===== */
.history-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* Light mode: use a clearly elevated surface with visible shadow */
.history-modal {
  background: var(--modal-bg, #ffffff);
  border: 1px solid var(--modal-border, rgba(0,0,0,0.12));
  border-radius: 14px;
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10);
  overflow: hidden;
}

[data-theme="dark"] .history-modal {
  background: #1a2235;
  border-color: rgba(255,255,255,0.1);
  box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
}

.history-modal__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--modal-border, rgba(0,0,0,0.10));
  background: var(--modal-header-bg, #f5f7fa);
  flex-shrink: 0;
}

[data-theme="dark"] .history-modal__header {
  background: rgba(255,255,255,0.04);
  border-bottom-color: rgba(255,255,255,0.08);
}

.history-modal__nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.history-modal__nav-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 1.1rem;
  width: 1.8rem;
  height: 1.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.history-modal__nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.history-modal__nav-btn:not(:disabled):hover { background: var(--bg-primary); }

.history-modal__nav-count {
  font-size: 0.78rem;
  color: var(--text-muted);
  min-width: 2.5rem;
  text-align: center;
}

.history-modal__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
}

.history-modal__time {
  font-size: 0.75rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.history-modal__dir {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
  background: var(--bg-code);
  border-radius: 4px;
  padding: 0.1em 0.4em;
}

.history-modal__close {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}
.history-modal__close:hover { color: var(--text-primary); background: var(--bg-elevated); }

.history-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.history-modal__section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.history-modal__section-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  font-weight: 700;
  border-bottom: 1px solid var(--modal-border, rgba(0,0,0,0.10));
  padding-bottom: 0.3rem;
  margin-bottom: 0.2rem;
}

.history-modal__markdown {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-primary);
}

/* Markdown styles inside modal */
.history-modal__markdown :deep(h1),
.history-modal__markdown :deep(h2),
.history-modal__markdown :deep(h3) {
  font-size: 1em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
  color: var(--text-primary);
}
.history-modal__markdown :deep(p) { margin: 0.4em 0; }
.history-modal__markdown :deep(code) {
  background: var(--bg-elevated);
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-size: 0.85em;
  font-family: monospace;
}
.history-modal__markdown :deep(pre) {
  background: var(--bg-elevated);
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.82em;
}
.history-modal__markdown :deep(pre code) { background: none; padding: 0; }
.history-modal__markdown :deep(ul), .history-modal__markdown :deep(ol) { padding-left: 1.4em; margin: 0.4em 0; }
.history-modal__markdown :deep(li) { margin: 0.15em 0; }
.history-modal__markdown :deep(blockquote) {
  border-left: 3px solid var(--border);
  padding-left: 0.75rem;
  color: var(--text-secondary);
  margin: 0.4em 0;
}

.history-modal__section--feedback {
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
}

.history-modal__feedback-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .history-modal, .modal-leave-active .history-modal { transition: transform 0.15s ease; }
.modal-enter-from .history-modal, .modal-leave-to .history-modal { transform: scale(0.95); }
</style>
