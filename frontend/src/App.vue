<template>
  <AppLayout>
    <WaitingPage v-if="isWaiting" />
    <FeedbackPage v-else />
  </AppLayout>

  <NotificationToast :toasts="toasts" @remove="remove" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import AppLayout from './components/layout/AppLayout.vue'
import FeedbackPage from './components/layout/FeedbackPage.vue'
import WaitingPage from './components/session/WaitingPage.vue'
import NotificationToast from './components/common/NotificationToast.vue'

import { useSessionStore } from './stores/session'
import { useSettingsStore } from './stores/settings'
import { useI18nStore } from './stores/i18n'
import { useNotification } from './composables/useNotification'
import { wsManager } from './api/websocket'
import { storeToRefs } from 'pinia'

const sessionStore = useSessionStore()
const settingsStore = useSettingsStore()
const i18nStore = useI18nStore()
const { isWaiting } = storeToRefs(sessionStore)
const { toasts, remove, showFromCode } = useNotification()

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme || 'light')
}

// Handle notification messages from WS
const offMsg = wsManager.onMessage((msg) => {
  if (msg.type === 'notification') {
    showFromCode(msg.code, msg.severity)
  }
})

onMounted(async () => {
  // Load i18n, settings first
  await Promise.all([i18nStore.load(), settingsStore.load()])

  // Apply saved language
  const savedLang = settingsStore.settings.language as 'zh-CN' | 'zh-TW' | 'en' | undefined
  if (savedLang) i18nStore.setLang(savedLang)

  // Apply saved theme
  applyTheme(settingsStore.settings.theme || 'light')

  // Watch for theme changes
  watch(() => settingsStore.settings.theme, (t) => applyTheme(t || 'light'))

  // Init WebSocket (starts connecting)
  sessionStore.initWebSocket()

  // Fetch initial session status via HTTP
  await sessionStore.fetchStatus()
  if (sessionStore.hasSession) {
    await sessionStore.fetchCurrentSession()
  }
})

onUnmounted(() => {
  offMsg()
  wsManager.disconnect()
})
</script>

<style>
/* ===== CSS 主题变量 ===== */
:root, [data-theme="light"] {
  --bg-base:      #f5f7fa;
  --bg-surface:   #ffffff;
  --bg-elevated:  #f0f2f5;
  --bg-code:      #f6f8fa;
  --border:       rgba(0,0,0,0.09);
  --text-primary: #1a2233;
  --text-secondary: #5a6a7e;
  --text-muted:   #9ba8b8;
  --accent:       #6366f1;
  --accent-soft:  rgba(99,102,241,0.08);
  --accent-text:  #4f46e5;
  --success:      #10b981;
  --warning:      #f59e0b;
  --error:        #ef4444;
  --header-bg:    rgba(255,255,255,0.95);
  --header-border: rgba(0,0,0,0.08);
  --scrollbar-thumb: rgba(99,102,241,0.2);
  --scrollbar-hover: rgba(99,102,241,0.4);
  --code-bg:      #f6f8fa;
  --code-border:  rgba(0,0,0,0.06);
  --hljs-bg:      #f6f8fa;
}

[data-theme="dark"] {
  --bg-base:      #0a0f1e;
  --bg-surface:   rgba(15,23,42,0.6);
  --bg-elevated:  rgba(15,23,42,0.98);
  --bg-code:      rgba(0,0,0,0.4);
  --border:       rgba(255,255,255,0.07);
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted:   #64748b;
  --accent:       #6366f1;
  --accent-soft:  rgba(99,102,241,0.08);
  --accent-text:  #a5b4fc;
  --success:      #10b981;
  --warning:      #f59e0b;
  --error:        #ef4444;
  --header-bg:    rgba(15,23,42,0.95);
  --header-border: rgba(255,255,255,0.06);
  --scrollbar-thumb: rgba(99,102,241,0.25);
  --scrollbar-hover: rgba(99,102,241,0.45);
  --code-bg:      rgba(0,0,0,0.4);
  --code-border:  rgba(255,255,255,0.06);
  --hljs-bg:      #0d1117;
}

/* ===== 全局基础样式 ===== */
*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  transition: background 0.2s, color 0.2s;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-hover); }
</style>
