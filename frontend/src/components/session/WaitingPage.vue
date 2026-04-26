<template>
  <div class="waiting-page">
    <div class="waiting-page__card">
      <div class="waiting-page__icon">🤖</div>
      <h2 class="waiting-page__title">{{ i18n.t('waiting.title') }}</h2>
      <p class="waiting-page__desc">{{ i18n.t('waiting.desc') }}</p>
      <div class="waiting-page__dots">
        <span /><span /><span />
      </div>
      <div class="waiting-page__ws">
        <WsStatusBadge :status="wsStatus" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WsStatusBadge from '../common/WsStatusBadge.vue'
import { useI18nStore } from '../../stores/i18n'
import { useSessionStore } from '../../stores/session'
import { storeToRefs } from 'pinia'

const i18n = useI18nStore()
const sessionStore = useSessionStore()
const { wsStatus } = storeToRefs(sessionStore)
</script>

<style scoped>
.waiting-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.waiting-page__card {
  text-align: center;
  max-width: 380px;
}

.waiting-page__icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  filter: grayscale(0.3);
}

.waiting-page__title {
  color: var(--text-primary);
  font-size: 1.2rem;
  margin: 0 0 0.5rem;
}

.waiting-page__desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
}

.waiting-page__dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.waiting-page__dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.5);
  animation: bounce 1.2s infinite;
}

.waiting-page__dots span:nth-child(2) { animation-delay: 0.2s; }
.waiting-page__dots span:nth-child(3) { animation-delay: 0.4s; }

.waiting-page__ws { display: flex; justify-content: center; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-8px); opacity: 1; }
}
</style>
