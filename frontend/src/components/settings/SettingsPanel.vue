<template>
  <div class="settings-panel">
    <h3 class="settings-panel__title">{{ i18n.t('settings.title') }}</h3>

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
      <input type="checkbox" v-model="settings.enable_base64_detail" @change="save" />
    </div>

    <!-- Auto submit -->
    <div class="settings-panel__row">
      <label>{{ i18n.t('settings.autoSubmit') }}</label>
      <input type="checkbox" v-model="settings.autoSubmitEnabled" @change="save" />
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
      <input type="checkbox" v-model="settings.timeoutEnabled" @change="onTimeoutChange" />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18nStore } from '../../stores/i18n'
import { useSettingsStore } from '../../stores/settings'
import { useTimeout } from '../../composables/useTimer'
import { api } from '../../api/http'

const i18n = useI18nStore()
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const { syncToServer } = useTimeout()

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
</script>

<style scoped>
.settings-panel {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-panel__title {
  color: var(--text-primary);
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

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
</style>
