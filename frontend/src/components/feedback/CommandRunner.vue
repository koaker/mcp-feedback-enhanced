<template>
  <div class="command-runner">
    <div class="command-runner__header">
      <span class="command-runner__title">{{ i18n.t('command.title') }}</span>
      <button class="command-runner__clear" @click="clearLogs" :title="i18n.t('command.clearLogs')">
        {{ i18n.t('command.clear') }}
      </button>
    </div>

    <div class="command-runner__input-row">
      <input
        v-model="command"
        class="command-runner__input"
        :placeholder="i18n.t('command.placeholder')"
        @keydown.enter="run"
        :disabled="running"
      />
      <button
        class="command-runner__run"
        :disabled="!command.trim() || running"
        @click="run"
      >
        {{ running ? i18n.t('command.running') : i18n.t('command.run') }}
      </button>
    </div>

    <div ref="logsEl" class="command-runner__logs">
      <template v-if="logs.length">
        <span
          v-for="(line, i) in logs"
          :key="i"
          class="command-runner__line"
          v-html="colorize(line)"
        />
      </template>
      <span v-else class="command-runner__empty">{{ i18n.t('command.empty') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useI18nStore } from '../../stores/i18n'
import { wsManager } from '../../api/websocket'
import { useSessionStore } from '../../stores/session'

const i18n = useI18nStore()
const sessionStore = useSessionStore()

const command = ref('')
const running = ref(false)
const logsEl = ref<HTMLElement | null>(null)

const logs = sessionStore.commandLogs

function run() {
  const cmd = command.value.trim()
  if (!cmd || running.value) return
  running.value = true
  wsManager.send({ type: 'run_command', command: cmd })
  command.value = ''
}

function clearLogs() {
  sessionStore.clearCommandLogs()
}

// Watch for command_complete / command_error to reset running flag
const offMsg = wsManager.onMessage((msg) => {
  if (msg.type === 'command_complete' || msg.type === 'command_error') {
    running.value = false
  }
})

// Auto-scroll
watch(() => logs.length, async () => {
  await nextTick()
  if (logsEl.value) logsEl.value.scrollTop = logsEl.value.scrollHeight
})

onUnmounted(() => offMsg())

// Very simple ANSI color strip for display (strip codes)
function colorize(line: string) {
  return line.replace(/\x1b\[[0-9;]*m/g, '')
}
</script>

<style scoped>
.command-runner {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  height: 100%;
}

.command-runner__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background: var(--accent-soft);
  border-bottom: 1px solid var(--border);
}

.command-runner__title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.command-runner__clear {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.command-runner__clear:hover { color: var(--text-secondary); }

.command-runner__input-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.command-runner__input {
  flex: 1;
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.4rem 0.7rem;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}
.command-runner__input:focus { border-color: rgba(99, 102, 241, 0.5); }
.command-runner__input::placeholder { color: var(--text-muted); }

.command-runner__run {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  border-radius: 6px;
  color: var(--accent-text);
  padding: 0.4rem 0.9rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.command-runner__run:hover:not(:disabled) { background: rgba(99, 102, 241, 0.35); }
.command-runner__run:disabled { opacity: 0.4; cursor: not-allowed; }

.command-runner__logs {
  flex: 1;
  overflow-y: auto;
  padding: 0.6rem 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  color: var(--text-secondary);
  min-height: 80px;
}

.command-runner__line { white-space: pre-wrap; word-break: break-all; line-height: 1.5; }
.command-runner__empty { color: var(--text-muted); font-style: italic; font-size: 0.8rem; }
</style>
