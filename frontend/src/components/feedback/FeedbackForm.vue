<template>
  <div class="feedback-form">
    <!-- Textarea -->
    <div class="feedback-form__field">
      <textarea
        v-model="text"
        class="feedback-form__textarea"
        :placeholder="i18n.t('feedback.placeholder')"
        rows="5"
        @keydown.ctrl.enter="submit"
        @keydown.meta.enter="submit"
        @input="resetAutoSubmit"
        @paste="onPaste"
        :disabled="submitted"
      />
    </div>

    <!-- Image upload -->
    <ImageUpload v-model:images="images" />

    <!-- Auto-submit countdown -->
    <div v-if="autoSubmitEnabled && remaining > 0" class="feedback-form__auto">
      {{ autoSubmitLabel }}
      <button class="feedback-form__cancel-auto" @click="cancelAutoSubmit">{{ i18n.t('feedback.cancelAuto') }}</button>
    </div>

    <!-- Actions -->
    <div class="feedback-form__actions">
      <span class="feedback-form__hint">{{ i18n.t('feedback.hint') }}</span>
      <button
        class="feedback-form__submit"
        :disabled="submitted || submitting"
        @click="submit"
      >
        <span v-if="submitting">{{ i18n.t('feedback.submitting') }}</span>
        <span v-else-if="submitted">{{ i18n.t('feedback.submitted') }}</span>
        <span v-else>{{ i18n.t('feedback.submit') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ImageUpload from './ImageUpload.vue'
import type { ImageItem } from '../../types/session'
import { useI18nStore } from '../../stores/i18n'
import { useSettingsStore } from '../../stores/settings'
import { useSessionStore } from '../../stores/session'
import { wsManager } from '../../api/websocket'
import { useAutoSubmit } from '../../composables/useTimer'
import { storeToRefs } from 'pinia'

const i18n = useI18nStore()
const settingsStore = useSettingsStore()
const sessionStore = useSessionStore()
const { sessionId } = storeToRefs(sessionStore)

const text = ref('')
const images = ref<ImageItem[]>([])
const submitting = ref(false)
const submitted = ref(false)

// 新 session 到来时重置表单，解除输入框锁定
watch(sessionId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    text.value = ''
    images.value = []
    submitting.value = false
    submitted.value = false
    if (autoSubmitEnabled.value) startAutoSubmit()
  }
})

const autoSubmitEnabled = computed(() => settingsStore.settings.autoSubmitEnabled ?? false)
const autoSubmitLabel = computed(() => i18n.t('feedback.autoSubmit').replace('{seconds}', String(remaining.value)))

const { remaining, start: startAutoSubmit, stop: stopAutoSubmit, reset: resetAutoSubmit } = useAutoSubmit(doSubmit)

onMounted(() => {
  if (autoSubmitEnabled.value) startAutoSubmit()
})

onUnmounted(() => stopAutoSubmit())

function cancelAutoSubmit() {
  stopAutoSubmit()
}

// Paste image from clipboard (Ctrl+V)
async function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  const imageFiles: File[] = []
  for (const item of Array.from(items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }
  if (imageFiles.length === 0) return
  e.preventDefault()
  const limit = settingsStore.settings.image_size_limit ?? 1048576
  const results: ImageItem[] = []
  for (const file of imageFiles) {
    if (file.size > limit) continue
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    results.push({ name: file.name || `paste-${Date.now()}.png`, data, size: file.size })
  }
  if (results.length) images.value = [...images.value, ...results]
}

async function submit() {
  if (submitted.value || submitting.value) return
  doSubmit()
}

function doSubmit() {
  stopAutoSubmit()
  submitting.value = true

  wsManager.send({
    type: 'submit_feedback',
    feedback: text.value,
    images: images.value,
    settings: {
      image_size_limit: settingsStore.settings.image_size_limit,
      enable_base64_detail: settingsStore.settings.enable_base64_detail,
    },
  })

  submitting.value = false
  submitted.value = true
}
</script>

<style scoped>
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.feedback-form__textarea {
  width: 100%;
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.feedback-form__textarea:focus { border-color: rgba(99, 102, 241, 0.5); }
.feedback-form__textarea::placeholder { color: var(--text-muted); }
.feedback-form__textarea:disabled { opacity: 0.5; }

.feedback-form__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.feedback-form__hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.feedback-form__submit {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.55rem 1.4rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.feedback-form__submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.feedback-form__submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.feedback-form__auto {
  font-size: 0.82rem;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.feedback-form__cancel-auto {
  font-size: 0.78rem;
  color: var(--text-muted);
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.1rem 0.5rem;
  cursor: pointer;
}
.feedback-form__cancel-auto:hover { color: var(--text-secondary); }
</style>
