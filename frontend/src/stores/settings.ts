import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '../types/api'
import { api } from '../api/http'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    layoutMode: 'combined-vertical',
    logLevel: 'INFO',
    enable_base64_detail: false,
    image_size_limit: 1048576,
    language: 'zh-CN',
    autoSubmitEnabled: false,
    autoSubmitSeconds: 30,
    timeoutEnabled: false,
    timeoutSeconds: 3600,
    theme: 'light',
  })

  async function load() {
    try {
      const data = await api.loadSettings()
      settings.value = { ...settings.value, ...data }
    } catch (e) {
      console.warn('[Settings] load failed, using defaults', e)
    }
  }

  async function save(partial?: Partial<Settings>) {
    if (partial) settings.value = { ...settings.value, ...partial }
    try {
      await api.saveSettings(settings.value)
    } catch (e) {
      console.error('[Settings] save failed', e)
    }
  }

  async function clear() {
    try {
      await api.clearSettings()
      settings.value = {
        layoutMode: 'combined-vertical',
        logLevel: 'INFO',
        enable_base64_detail: false,
        image_size_limit: 1048576,
        language: 'zh-CN',
        theme: 'light',
      }
    } catch (e) {
      console.error('[Settings] clear failed', e)
    }
  }

  return { settings, load, save, clear }
})
