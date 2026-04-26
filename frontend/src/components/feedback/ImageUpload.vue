<template>
  <div class="image-upload">
    <!-- Drop zone -->
    <div
      class="image-upload__dropzone"
      :class="{ 'image-upload__dropzone--drag': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp,image/webp"
        multiple
        hidden
        @change="onFileChange"
      />
      <span class="image-upload__icon">📎</span>
      <span class="image-upload__hint">{{ i18n.t('imageUpload.hint') }}</span>
    </div>

    <!-- Preview grid -->
    <div v-if="images.length" class="image-upload__previews">
      <div
        v-for="(img, idx) in images"
        :key="img.name + idx"
        class="image-upload__preview"
      >
        <img :src="`data:image/*;base64,${img.data}`" :alt="img.name" />
        <button class="image-upload__remove" @click="remove(idx)" title="删除">✕</button>
        <span class="image-upload__size">{{ formatSize(img.size) }}</span>
      </div>
    </div>

    <p v-if="error" class="image-upload__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ImageItem } from '../../types/session'
import { useI18nStore } from '../../stores/i18n'
import { useSettingsStore } from '../../stores/settings'

const props = defineProps<{ images: ImageItem[] }>()
const emit = defineEmits<{
  (e: 'update:images', images: ImageItem[]): void
}>()

const i18n = useI18nStore()
const settingsStore = useSettingsStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const error = ref('')

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp']

async function processFiles(files: FileList | File[]) {
  error.value = ''
  const limit = settingsStore.settings.image_size_limit ?? 1048576
  const arr = Array.from(files)
  const results: ImageItem[] = []

  for (const file of arr) {
    if (!ALLOWED.includes(file.type)) {
      error.value = i18n.t('imageUpload.unsupportedType').replace('{{name}}', file.name)
      continue
    }
    if (file.size > limit) {
      error.value = i18n.t('imageUpload.tooLarge').replace('{{name}}', file.name).replace('{{limit}}', formatSize(limit))
      continue
    }
    const data = await toBase64(file)
    results.push({ name: file.name, data, size: file.size })
  }

  emit('update:images', [...props.images, ...results])
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip data URL prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) processFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) processFiles(e.dataTransfer.files)
}

function remove(idx: number) {
  const updated = [...props.images]
  updated.splice(idx, 1)
  emit('update:images', updated)
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1048576).toFixed(1)}MB`
}
</script>

<style scoped>
.image-upload__dropzone {
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.image-upload__dropzone:hover,
.image-upload__dropzone--drag {
  border-color: rgba(99, 102, 241, 0.7);
  background: rgba(99, 102, 241, 0.05);
  color: var(--accent-text);
}

.image-upload__previews {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.image-upload__preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.image-upload__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-upload__remove {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.6);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.image-upload__size {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(0,0,0,0.6);
  color: var(--text-primary);
  font-size: 9px;
  padding: 1px 3px;
  border-radius: 3px;
}

.image-upload__error {
  color: #fca5a5;
  font-size: 0.8rem;
  margin-top: 0.4rem;
}
</style>
