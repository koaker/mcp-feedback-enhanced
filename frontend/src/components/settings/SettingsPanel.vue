<template>
  <div class="settings-panel">
    <div class="settings-panel__header">
      <h3 class="settings-panel__title">{{ i18n.t('settings.title') }}</h3>
      <button class="settings-panel__close" @click="emit('close')" title="关闭">✕</button>
    </div>

    <!-- Theme -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.theme') }}</label>
      <select v-model="settings.theme" @change="save" class="settings-panel__select">
        <option value="light">{{ i18n.t('settings.themeLight') }}</option>
        <option value="dark">{{ i18n.t('settings.themeDark') }}</option>
      </select>
    </div>

    <!-- Language -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.language') }}</label>
      <select v-model="lang" @change="onLangChange" class="settings-panel__select">
        <option v-for="l in i18n.availableLangs" :key="l.code" :value="l.code">{{ l.label }}</option>
      </select>
    </div>

    <!-- Layout mode -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.layoutMode') }}</label>
      <select v-model="settings.layoutMode" @change="save" class="settings-panel__select">
        <option value="combined-vertical">{{ i18n.t('settings.layoutVertical') }}</option>
        <option value="combined-horizontal">{{ i18n.t('settings.layoutHorizontal') }}</option>
      </select>
    </div>

    <!-- Image size limit -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.imageSizeLimit') }}</label>
      <select v-model.number="settings.image_size_limit" @change="save" class="settings-panel__select">
        <option :value="512 * 1024">512 KB</option>
        <option :value="1048576">1 MB</option>
        <option :value="2 * 1048576">2 MB</option>
        <option :value="5 * 1048576">5 MB</option>
      </select>
    </div>

    <!-- Enable base64 detail -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.enableBase64Detail') }}</label>
      <label class="toggle">
        <input type="checkbox" v-model="settings.enable_base64_detail" @change="save" />
        <span class="toggle__track"><span class="toggle__thumb" /></span>
      </label>
    </div>

    <!-- Auto submit -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.autoSubmit') }}</label>
      <label class="toggle">
        <input type="checkbox" v-model="settings.autoSubmitEnabled" @change="save" />
        <span class="toggle__track"><span class="toggle__thumb" /></span>
      </label>
    </div>
    <div class="settings-panel__row" v-if="settings.autoSubmitEnabled">
      <label>{{ i18n.t('settings.autoSubmitSeconds') }}</label>
      <input
        type="number"
        v-model.number="settings.autoSubmitSeconds"
        min="5"
        max="300"
        class="settings-panel__number"
        @change="save"
      />
    </div>

    <!-- Timeout -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.timeout') }}</label>
      <label class="toggle">
        <input type="checkbox" v-model="settings.timeoutEnabled" @change="onTimeoutChange" />
        <span class="toggle__track"><span class="toggle__thumb" /></span>
      </label>
    </div>
    <div class="settings-panel__row" v-if="settings.timeoutEnabled">
      <label>{{ i18n.t('settings.timeoutSeconds') }}</label>
      <input
        type="number"
        v-model.number="settings.timeoutSeconds"
        min="60"
        class="settings-panel__number"
        @change="onTimeoutChange"
      />
    </div>

    <!-- Log level -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.logLevel') }}</label>
      <select v-model="settings.logLevel" @change="onLogLevelChange" class="settings-panel__select">
        <option>DEBUG</option>
        <option>INFO</option>
        <option>WARNING</option>
        <option>ERROR</option>
      </select>
    </div>

    <div class="settings-panel__actions">
      <button class="settings-panel__reset" @click="resetSettings">{{ i18n.t('settings.reset') }}</button>
      <button class="settings-panel__restart" @click="restartServer" :disabled="restarting">
        {{ restarting ? i18n.t('settings.restartServerSuccess') : i18n.t('settings.restartServer') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18nStore } from '../../stores/i18n'
import { useSettingsStore } from '../../stores/settings'
import { useTimeout } from '../../composables/useTimer'
import { api } from '../../api/http'

const emit = defineEmits<{ close: [] }>()
const i18n = useI18nStore()
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const { syncToServer } = useTimeout()

const restarting = ref(false)

const lang = computed({
  get: () => (settingsStore.settings.language as 'zh-CN' | 'zh-TW' | 'en') || 'zh-CN',
  set: (v) => { settingsStore.settings.language = v },
})

function onLangChange() {
  i18n.setLang(lang.value)
  save()
}

async function save() {
  await settingsStore.save()
}

async function onLogLevelChange() {
  await api.setLogLevel(settingsStore.settings.logLevel || 'INFO')
  await save()
}

function onTimeoutChange() {
  syncToServer()
  save()
}

async function resetSettings() {
  await settingsStore.clear()
}

async function restartServer() {
  if (!confirm(i18n.t('settings.restartServerConfirm'))) return
  restarting.value = true
  try {
    await fetch('/api/restart-server', { method: 'POST' })
  } catch {
    // ignore network error — server is restarting
  }
  // Wait a few seconds then reload
  setTimeout(() => {
    window.location.reload()
  }, 4000)
}
</script>

<style scoped>
.settings-panel {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  overflow-y: auto;
}

.settings-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.settings-panel__title {
  color: var(--text-primary);
  font-size: 1rem;
  margin: 0;
}

.settings-panel__close {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0 0.4rem;
  cursor: pointer;
  line-height: 1.6;
}
.settings-panel__close:hover { color: var(--text-primary); }

.settings-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.87rem;
  color: var(--text-secondary);
}

.settings-panel__select {
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  outline: none;
}

.settings-panel__number {
  width: 80px;
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  outline: none;
  text-align: right;
}

.settings-panel__actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.settings-panel__reset {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #fca5a5;
  font-size: 0.82rem;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
}
.settings-panel__reset:hover { background: rgba(239, 68, 68, 0.2); }

.settings-panel__restart {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #93c5fd;
  font-size: 0.82rem;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
}
.settings-panel__restart:hover:not(:disabled) { background: rgba(59, 130, 246, 0.2); }
.settings-panel__restart:disabled { opacity: 0.6; cursor: not-allowed; }

/* Toggle switch */
.toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.toggle input { display: none; }
.toggle__track {
  width: 36px;
  height: 20px;
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: 10px;
  position: relative;
  transition: background 0.2s, border-color 0.2s;
}
.toggle input:checked ~ .toggle__track {
  background: rgba(99, 102, 241, 0.7);
  border-color: rgba(99, 102, 241, 0.9);
}
.toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: transform 0.2s, background 0.2s;
}
.toggle input:checked ~ .toggle__track .toggle__thumb {
  transform: translateX(16px);
  background: #fff;
}
</style>
