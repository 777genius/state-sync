<script setup lang="ts">
import { useRouter } from 'vitepress';

const { go } = useRouter();

const cards = [
  { icon: '\u{1F680}', title: 'Quickstart', desc: 'Get running in 5 minutes', link: '/guide/quickstart' },
  { icon: '\u2696\uFE0F', title: 'Comparison', desc: 'vs @tauri-store, zubridge, and more', link: '/comparison' },
  { icon: '\u{1F4CA}', title: 'Benchmarks', desc: 'Real IPC latency & coalescing numbers', link: '/benchmarks' },
  { icon: '\u{1F4DD}', title: 'Blog', desc: 'Deep dives & architecture decisions', link: '/blog/' },
];
</script>

<template>
  <div class="explore-grid">
    <button
      v-for="card in cards"
      :key="card.title"
      class="explore-card"
      @click="go(card.link)"
    >
      <span class="explore-icon">{{ card.icon }}</span>
      <strong>{{ card.title }}</strong>
      <span class="explore-desc">{{ card.desc }}</span>
    </button>
  </div>
</template>

<style scoped>
.explore-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 24px 0;
}

@media (max-width: 640px) {
  .explore-grid {
    grid-template-columns: 1fr;
  }
}

.explore-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s, background-color 0.25s, transform 0.2s;
}

.explore-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.explore-icon {
  font-size: 24px;
  line-height: 1;
  margin-bottom: 4px;
}

.explore-card strong {
  font-size: 16px;
  color: var(--vp-c-text-1);
}

.explore-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}
</style>
