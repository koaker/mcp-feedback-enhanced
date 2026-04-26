<template>
  <transition-group name="toast" tag="div" class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.severity}`"
      @click="remove(toast.id)"
    >
      <span class="toast__icon">{{ iconMap[toast.severity] }}</span>
      <span class="toast__msg">{{ toast.message }}</span>
    </div>
  </transition-group>
</template>

<script setup lang="ts">
const props = defineProps<{
  toasts: Array<{ id: number; message: string; severity: 'success' | 'warning' | 'error' | 'info' }>
}>()
const emit = defineEmits<{ (e: 'remove', id: number): void }>()

const iconMap = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' }

function remove(id: number) {
  emit('remove', id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 360px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 4px 20px var(--code-bg);
  color: var(--text-primary);
}

.toast--success { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }
.toast--warning { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }
.toast--error   { background: rgba(239, 68, 68, 0.15);  border-color: rgba(239, 68, 68, 0.3); }
.toast--info    { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.3); }

.toast__icon { font-weight: bold; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to   { opacity: 0; transform: translateX(100%); }
</style>
