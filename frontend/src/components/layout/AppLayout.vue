<template>
  <div class="app-layout" :class="`app-layout--${layoutMode}`">
    <!-- Topbar -->
    <header class="app-layout__header">
      <div class="app-layout__header-left">
        <button
          class="app-layout__icon-btn"
          :class="{ active: activeDrawer === 'history' }"
          @click="toggleDrawer('history')"
          :title="i18n.t('history.title')"
        >🕒</button>
        <button
          class="app-layout__icon-btn"
          :class="{ active: activeDrawer === 'settings' }"
          @click="toggleDrawer('settings')"
          :title="i18n.t('settings.title')"
        >⚙</button>
        <button
          class="app-layout__icon-btn"
          :class="{ active: activeDrawer === 'logs' }"
          @click="toggleDrawer('logs')"
          :title="i18n.t('logs.title')"
        >📋</button>
        <button
          class="app-layout__icon-btn"
          @click="reloadPage"
          title="重新加载界面"
        >🔄</button>
      </div>
      <span class="app-layout__brand">MCP Feedback Enhanced</span>
      <div class="app-layout__header-right">
        <WsStatusBadge :status="wsStatus" />
      </div>
    </header>

    <!-- Settings top drawer -->
    <!-- REMOVED - now using side drawer -->

    <!-- Main content -->
    <main class="app-layout__main">
      <slot />
    </main>

    <!-- Settings side drawer overlay -->
    <transition name="overlay">
      <div
        v-if="activeDrawer === 'settings'"
        class="app-layout__side-overlay"
        @click="closeDrawer"
      />
    </transition>

    <!-- Settings side drawer -->
    <transition name="side-drawer">
      <div v-if="activeDrawer === 'settings'" class="app-layout__side-drawer">
        <SettingsPanel @close="closeDrawer" />
      </div>
    </transition>

    <!-- History side drawer overlay -->
    <transition name="overlay">
      <div
        v-if="activeDrawer === 'history'"
        class="app-layout__side-overlay"
        @click="closeDrawer"
      />
    </transition>

    <!-- History side drawer -->
    <transition name="side-drawer">
      <div v-if="activeDrawer === 'history'" class="app-layout__side-drawer">
        <HistoryPanel @close="closeDrawer" />
      </div>
    </transition>

    <!-- Logs side drawer overlay -->
    <transition name="overlay">
      <div
        v-if="activeDrawer === 'logs'"
        class="app-layout__side-overlay"
        @click="closeDrawer"
      />
    </transition>

    <!-- Logs side drawer -->
    <transition name="side-drawer">
      <div
        v-if="activeDrawer === 'logs'"
        class="app-layout__side-drawer"
        :style="{ width: drawerWidth + 'px' }"
      >
        <LogPanel @close="closeDrawer" />
        <!-- Drag handle -->
        <div class="app-layout__resize-handle" @mousedown="startResize" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import WsStatusBadge from '../common/WsStatusBadge.vue'
import SettingsPanel from '../settings/SettingsPanel.vue'
import HistoryPanel from '../history/HistoryPanel.vue'
import LogPanel from '../logs/LogPanel.vue'
import { useI18nStore } from '../../stores/i18n'
import { useSettingsStore } from '../../stores/settings'
import { useSessionStore } from '../../stores/session'
import { storeToRefs } from 'pinia'

const i18n = useI18nStore()
const settingsStore = useSettingsStore()
const sessionStore = useSessionStore()
const { wsStatus } = storeToRefs(sessionStore)
const activeDrawer = ref<'settings' | 'history' | 'logs' | null>(null)
const layoutMode = computed(() => settingsStore.settings.layoutMode || 'combined-vertical')
const drawerWidth = ref(480)

function toggleDrawer(panel: 'settings' | 'history' | 'logs') {
  activeDrawer.value = activeDrawer.value === panel ? null : panel
}

function closeDrawer() {
  activeDrawer.value = null
}

function reloadPage() {
  window.location.reload()
}

function startResize(e: MouseEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startW = drawerWidth.value

  function onMove(ev: MouseEvent) {
    const delta = ev.clientX - startX
    const newW = Math.min(Math.max(startW + delta, 280), window.innerWidth * 0.9)
    drawerWidth.value = newW
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  color: var(--text-primary);
  position: relative;
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

.app-layout__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}

.app-layout__brand {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-text);
  letter-spacing: 0.02em;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.app-layout__header-right {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
  justify-content: flex-end;
}

.app-layout__icon-btn {
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
.app-layout__icon-btn:hover,
.app-layout__icon-btn.active {
  color: var(--accent-text);
  border-color: rgba(99, 102, 241, 0.4);
}

/* Settings top drawer (unchanged) */
.app-layout__drawer {
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  max-height: 400px;
  overflow-y: auto;
  padding: 0 0 0.5rem;
}

.app-layout__main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Side drawer overlay */
.app-layout__side-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
}

/* Side drawer panel */
.app-layout__side-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 201;
  width: 480px;
  max-width: 90vw;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Drag resize handle */
.app-layout__resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  bottom: 0;
  cursor: col-resize;
  z-index: 10;
}
.app-layout__resize-handle:hover,
.app-layout__resize-handle:active {
  background: var(--accent-text);
  opacity: 0.3;
}

/* Top drawer transitions */
.drawer-enter-active, .drawer-leave-active { transition: max-height 0.25s ease, opacity 0.2s ease; }
.drawer-enter-from, .drawer-leave-to { max-height: 0; opacity: 0; }

/* Overlay transition */
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

/* Side drawer slide-in transition */
.side-drawer-enter-active, .side-drawer-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.side-drawer-enter-from, .side-drawer-leave-to { transform: translateX(-100%); }
</style>
