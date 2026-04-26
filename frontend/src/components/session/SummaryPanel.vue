<template>
  <div class="summary-panel">
    <div class="summary-panel__header">
      <span class="summary-panel__title">{{ i18n.t('summary.title') }}</span>
      <span v-if="projectDirectory" class="summary-panel__dir" :title="projectDirectory">
        {{ shortDir }}
      </span>
    </div>
    <div class="summary-panel__body" ref="bodyRef" v-html="renderedSummary" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, nextTick, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { useI18nStore } from '../../stores/i18n'

const props = defineProps<{
  summary: string
  projectDirectory: string
}>()

const i18n = useI18nStore()
const bodyRef = ref<HTMLElement | null>(null)

const renderedSummary = computed(() => {
  if (!props.summary) return `<p class="summary-panel__empty">${i18n.t('summary.empty')}</p>`
  const raw = marked.parse(props.summary, { async: false }) as string
  return DOMPurify.sanitize(raw, { ADD_TAGS: ['span'] })
})

function applyHighlight() {
  nextTick(() => {
    if (!bodyRef.value) return
    bodyRef.value.querySelectorAll('pre code').forEach((block) => {
      if (!(block as HTMLElement).dataset.highlighted) {
        hljs.highlightElement(block as HTMLElement)
      }
    })
    // Inject copy buttons into every <pre> that doesn't already have one
    bodyRef.value.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return
      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.title = '复制'
      btn.textContent = '⎘'
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code')
        const text = code ? code.innerText : pre.innerText
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✓'
          btn.classList.add('copy-btn--copied')
          setTimeout(() => {
            btn.textContent = '⎘'
            btn.classList.remove('copy-btn--copied')
          }, 1500)
        })
      })
      pre.style.position = 'relative'
      pre.appendChild(btn)
    })
  })
}

onMounted(applyHighlight)
watch(renderedSummary, applyHighlight)

const shortDir = computed(() => {
  if (!props.projectDirectory) return ''
  const parts = props.projectDirectory.replace(/\\/g, '/').split('/')
  return parts.length > 2 ? `.../${parts.slice(-2).join('/')}` : props.projectDirectory
})
</script>

<style scoped>
.summary-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.summary-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background: var(--accent-soft);
  border-bottom: 1px solid var(--border);
  gap: 0.5rem;
}

.summary-panel__title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.summary-panel__dir {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-primary);
}

.summary-panel__body :deep(h1),
.summary-panel__body :deep(h2),
.summary-panel__body :deep(h3) {
  color: var(--text-primary);
  margin-top: 1em;
  margin-bottom: 0.4em;
}

.summary-panel__body :deep(code) {
  background: var(--accent-soft);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
}

.summary-panel__body :deep(pre) {
  background: var(--code-bg);
  padding: 0.8rem 1rem;
  border-radius: 6px;
  overflow-x: auto;
  border: 1px solid var(--border);
}

.summary-panel__body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.summary-panel__body :deep(ul),
.summary-panel__body :deep(ol) {
  padding-left: 1.4em;
}

.summary-panel__body :deep(blockquote) {
  border-left: 3px solid rgba(99, 102, 241, 0.5);
  margin: 0;
  padding-left: 0.8em;
  color: var(--text-secondary);
}

.summary-panel__body :deep(a) {
  color: #818cf8;
  text-decoration: none;
}
.summary-panel__body :deep(a:hover) { text-decoration: underline; }

.summary-panel__body :deep(table) {
  border-collapse: collapse;
  width: 100%;
}
.summary-panel__body :deep(th),
.summary-panel__body :deep(td) {
  border: 1px solid var(--border);
  padding: 0.4em 0.7em;
}
.summary-panel__body :deep(th) { background: rgba(99, 102, 241, 0.1); }

:deep(.summary-panel__empty) { color: var(--text-muted); font-style: italic; }

:deep(.copy-btn) {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.35);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 0.1rem 0.4rem;
  cursor: pointer;
  line-height: 1.6;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}
:deep(pre:hover .copy-btn) { opacity: 1; }
:deep(.copy-btn:hover) {
  background: rgba(99, 102, 241, 0.3);
  color: var(--text-primary);
}
:deep(.copy-btn--copied) {
  opacity: 1;
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.4);
  background: rgba(74, 222, 128, 0.1);
}
</style>
