<template>
  <div class="app-layout" :class="`app-layout--${layoutMode}`">
    <!-- Topbar -->
    <header class="app-layout__header">
      <span class="app-layout__brand">MCP Feedback Enhanced</span>
      <div class="app-layout__header-right">
        <WsStatusBadge :status="wsStatus" />
        <button
          class="app-layout__settings-btn"
          :class="{ active: showSettings }"
          @click="showSettings = !showSettings"
          :title="i18n.t('settings.title')"
        >⚙</button>
        <button
          class="app-layout__reload-btn"
          @click="reloadPage"
          title="重新加载界面"
        >🔄</button>
      </div>
    </header>

    <!-- Settings drawer -->
    <transition name="drawer">
      <div v-if="showSettings" class="app-layout__drawer">
        <SettingsPanel />
      </div>
    </transition>

    <!-- Main content -->
    <main class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import WsStatusBadge from '../common/WsStatusBadge.vue'
import SettingsPanel from '../settings/SettingsPanel.vue'
import { useI18nStore } from '../../stores/i18n'
import { useSettingsStore } from '../../stores/settings'
import { useSessionStore } from '../../stores/session'
import { storeToRefs } from 'pinia'

const i18n = useI18nStore()
const settingsStore = useSettingsStore()
const sessionStore = useSessionStore()
const { wsStatus } = storeToRefs(sessionStore)
const showSettings = ref(false)
const layoutMode = computed(() => settingsStore.settings.layoutMode || 'combined-vertical')

function reloadPage() {
  window.location.reload()
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  color: var(--text-primary);
}

.app-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.2rem;
  height: 48px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.app-layout__brand {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-text);
  letter-spacing: 0.02em;
}

.app-layout__header-right {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.app-layout__settings-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 1rem;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, border-color 0.2s;
}
.app-layout__settings-btn:hover,
.app-layout__settings-btn.active {
  color: var(--accent-text);
  border-color: rgba(99, 102, 241, 0.4);
}

.app-layout__drawer {
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  max-height: 400px;
  overflow-y: auto;
}

.app-layout__main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-layout__reload-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.9rem;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, border-color 0.2s;
}
.app-layout__reload-btn:hover {
  color: var(--accent-text);
  border-color: rgba(99, 102, 241, 0.4);
}

.drawer-enter-active, .drawer-leave-active { transition: max-height 0.25s ease, opacity 0.2s ease; }
.drawer-enter-from, .drawer-leave-to { max-height: 0; opacity: 0; }
</style>
