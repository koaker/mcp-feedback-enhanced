import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/http'

type Lang = 'zh-CN' | 'zh-TW' | 'en'

export const useI18nStore = defineStore('i18n', () => {
  const translations = ref<Record<string, Record<string, unknown>>>({})
  const currentLang = ref<Lang>('zh-CN')

  async function load() {
    try {
      const data = await api.getTranslations()
      translations.value = data
    } catch (e) {
      console.error('[i18n] load failed', e)
    }
  }

  function setLang(lang: Lang) {
    currentLang.value = lang
  }

  function t(key: string, params?: Record<string, string>): string {
    const langData = translations.value[currentLang.value] || {}
    const keys = key.split('.')
    let val: unknown = langData
    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[k]
      } else {
        val = undefined
        break
      }
    }
    let result = typeof val === 'string' ? val : key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(`{{${k}}}`, v)
      }
    }
    return result
  }

  const availableLangs: { code: Lang; label: string }[] = [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' },
  ]

  return { translations, currentLang, load, setLang, t, availableLangs }
})
