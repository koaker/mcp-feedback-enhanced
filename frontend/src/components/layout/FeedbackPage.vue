<template>
  <div class="feedback-page" :class="`feedback-page--${layoutMode}`">
    <!-- Left/Top: Summary -->
    <div class="feedback-page__summary">
      <SummaryPanel :summary="summary" :project-directory="projectDirectory" />
    </div>

    <!-- Right/Bottom: Feedback only -->
    <div class="feedback-page__right">
      <div class="feedback-page__form">
        <FeedbackForm v-if="!feedbackCompleted" />
        <div v-else class="feedback-page__done">
          <div class="feedback-page__done-icon">✓</div>
          <p>{{ i18n.t('feedback.alreadySubmitted') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SummaryPanel from '../session/SummaryPanel.vue'
import FeedbackForm from '../feedback/FeedbackForm.vue'
import { useSessionStore } from '../../stores/session'
import { useSettingsStore } from '../../stores/settings'
import { useI18nStore } from '../../stores/i18n'
import { storeToRefs } from 'pinia'

const sessionStore = useSessionStore()
const settingsStore = useSettingsStore()
const i18n = useI18nStore()

const { summary, projectDirectory, feedbackCompleted } = storeToRefs(sessionStore)
const layoutMode = computed(() => settingsStore.settings.layoutMode || 'combined-vertical')
</script>

<style scoped>
.feedback-page {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1rem;
  padding: 1rem;
}

/* Vertical layout: summary on top */
.feedback-page--combined-vertical {
  flex-direction: column;
}

.feedback-page--combined-vertical .feedback-page__summary {
  flex: 0 0 40%;
  min-height: 0;
  overflow: hidden;
}

.feedback-page--combined-vertical .feedback-page__right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
}

/* Horizontal layout: summary left */
.feedback-page--combined-horizontal {
  flex-direction: row;
}

.feedback-page--combined-horizontal .feedback-page__summary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.feedback-page--combined-horizontal .feedback-page__right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  min-width: 0;
}

.feedback-page__form { flex: 0 0 auto; }

.feedback-page__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-muted);
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.feedback-page__done-icon {
  width: 48px;
  height: 48px;
  background: rgba(16, 185, 129, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6ee7b7;
  font-size: 1.4rem;
  margin-bottom: 0.8rem;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
</style>
