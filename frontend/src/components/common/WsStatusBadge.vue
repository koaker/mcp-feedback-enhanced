<template>
  <div class="ws-indicator" :class="`ws-indicator--${status}`" :title="label">
    <span class="ws-indicator__dot" />
    <span class="ws-indicator__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18nStore } from '../../stores/i18n'

const props = defineProps<{
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
}>()

const i18n = useI18nStore()

const label = computed(() => {
  const map: Record<string, string> = {
    connecting: i18n.t('connection.connecting'),
    connected: i18n.t('connection.connected'),
    disconnected: i18n.t('connection.disconnected'),
    error: i18n.t('connection.error'),
  }
  return map[props.status] || props.status
})
</script>

<style scoped>
.ws-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  border: 1px solid var(--border);
}

.ws-indicator__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ws-indicator--connected    { color: #6ee7b7; }
.ws-indicator--connected .ws-indicator__dot { background: #10b981; box-shadow: 0 0 6px #10b981; }

.ws-indicator--connecting   { color: #fde68a; }
.ws-indicator--connecting .ws-indicator__dot { background: #f59e0b; animation: pulse 1s infinite; }

.ws-indicator--disconnected { color: var(--text-secondary); }
.ws-indicator--disconnected .ws-indicator__dot { background: var(--text-muted); }

.ws-indicator--error        { color: #fca5a5; }
.ws-indicator--error .ws-indicator__dot { background: #ef4444; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
