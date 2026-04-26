<template>
  <div class="log-panel">
    <div class="log-panel__header">
      <h3 class="log-panel__title">{{ i18n.t('logs.title') }}</h3>
      <div class="log-panel__header-actions">
        <select v-model="filterLevel" class="log-panel__filter">
          <option value="">{{ i18n.t('logs.filterAll') }}</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>
        <button class="log-panel__btn" @click="load" :title="i18n.t('logs.refresh')">↻</button>
        <button class="log-panel__btn" @click="clearLogs" :title="i18n.t('logs.clear')">🗑</button>
        <button class="log-panel__close" @click="emit('close')" :title="i18n.t('logs.close')">✕</button>
      </div>
    </div>

    <div class="log-panel__toolbar">
      <label class="log-panel__auto-refresh">
        <input type="checkbox" v-model="autoRefresh" />
        {{ i18n.t('logs.autoRefresh') }}
      </label>
      <span class="log-panel__count">{{ i18n.t('logs.count').replace('{n}', String(filteredLogs.length)) }}</span>
    </div>

    <div class="log-panel__body">
      <div v-if="loading && filteredLogs.length === 0" class="log-panel__empty">{{ i18n.t('logs.loading') }}</div>
      <div v-else-if="filteredLogs.length === 0" class="log-panel__empty">{{ i18n.t('logs.empty') }}</div>
      <div
        v-for="(entry, idx) in filteredLogs"
        :key="idx"
        class="log-panel__entry"
        :class="`log-level--${entry.level.toLowerCase()}`"
      >
        <span class="log-panel__ts">{{ formatTs(entry.ts) }}</span>
        <span class="log-panel__level">{{ entry.level }}</span>
        <span class="log-panel__prefix">[{{ entry.prefix }}]</span>
        <span class="log-panel__msg">{{ entry.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18nStore } from '../../stores/i18n'

const emit = defineEmits<{ close: [] }>()
const i18n = useI18nStore()

interface LogEntry {
  ts: number
  level: string
  prefix: string
  message: string
}

const logs = ref<LogEntry[]>([])
const loading = ref(false)
const filterLevel = ref('')
const autoRefresh = ref(true)

let timer: ReturnType<typeof setInterval> | null = null

// 新日志在最上面（反转）
const filteredLogs = computed(() => {
  const list = filterLevel.value
    ? logs.value.filter(e => e.level === filterLevel.value)
    : logs.value
  return [...list].reverse()
})

function formatTs(ts: number): string {
  const d = new Date(ts * 1000)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

async function load() {
  loading.value = true
  try {
    const res = await fetch('/api/logs?tail=500')
    const data = await res.json()
    logs.value = data.logs || []
  } catch (e) {
    console.error('Failed to load logs', e)
  } finally {
    loading.value = false
  }
}

async function clearLogs() {
  try {
    await fetch('/api/logs', { method: 'DELETE' })
    logs.value = []
  } catch (e) {
    console.error('Failed to clear logs', e)
  }
}

onMounted(() => {
  load()
  timer = setInterval(() => {
    if (autoRefresh.value) load()
  }, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.log-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.2rem 0.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.log-panel__title {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.log-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.log-panel__filter {
  background: var(--bg-code);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 4px;
  padding: 0.1rem 0.3rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.log-panel__btn,
.log-panel__close {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 0 0.4rem;
  cursor: pointer;
  line-height: 1.6;
}
.log-panel__btn:hover { color: var(--accent-text); }
.log-panel__close:hover { color: var(--text-primary); }

.log-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 1.2rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.log-panel__auto-refresh {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
}

.log-panel__count {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.log-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem 0;
  font-family: 'JetBrains Mono', monospace;
}

.log-panel__empty {
  padding: 1.5rem 1.2rem;
  text-align: center;
  color: var(--text-muted);
}

.log-panel__entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.18rem 1rem;
  line-height: 1.5;
  word-break: break-all;
  flex-wrap: wrap;
  border-bottom: 1px solid transparent;
}
.log-panel__entry:hover { background: var(--bg-elevated); }

.log-panel__ts {
  color: var(--text-muted);
  flex-shrink: 0;
  font-size: 0.72rem;
}

.log-panel__level {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  min-width: 3.2rem;
}

.log-panel__prefix {
  color: var(--text-secondary);
  flex-shrink: 0;
  font-size: 0.72rem;
}

.log-panel__msg {
  color: var(--text-primary);
  font-size: 0.78rem;
  flex: 1;
  min-width: 0;
}

/* Level colors */
.log-level--info .log-panel__level { color: #60a5fa; }
.log-level--warn .log-panel__level { color: #fbbf24; }
.log-level--error .log-panel__level { color: #f87171; }
.log-level--error .log-panel__msg { color: #fca5a5; }
.log-level--debug .log-panel__level { color: var(--text-muted); }
</style>
