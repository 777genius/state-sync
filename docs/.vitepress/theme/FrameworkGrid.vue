<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import { stateAdapters, runtimeAdapters } from './package-icons';

const { isDark } = useData();

function iconSrc(icon: { light: string; dark?: string }) {
  return isDark.value && icon.dark ? icon.dark : icon.light;
}
</script>

<template>
  <div class="framework-grid">
    <a
      v-for="fw in stateAdapters"
      :key="fw.slug"
      :href="withBase(fw.link)"
      class="framework-card"
    >
      <img :src="iconSrc(fw.icon)" :alt="fw.name" class="framework-icon" />
      <span class="framework-name">{{ fw.name }}</span>
    </a>

    <div class="section-divider">
      <span class="section-label">Desktop Runtimes</span>
    </div>

    <a
      v-for="fw in runtimeAdapters"
      :key="fw.slug"
      :href="withBase(fw.link)"
      class="framework-card runtime-card"
    >
      <img :src="iconSrc(fw.icon)" :alt="fw.name" class="framework-icon" />
      <span class="framework-name">{{ fw.name }}</span>
    </a>
  </div>
</template>

<style scoped>
.framework-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin: 24px 0;
}

.framework-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-decoration: none !important;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.25s, background-color 0.25s, transform 0.2s;
}

.framework-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.framework-icon {
  width: 20px;
  height: 20px;
}

.dark .framework-icon {
  opacity: 0.9;
}

.framework-name {
  line-height: 1;
}

.section-divider {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--vp-c-divider);
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.runtime-card {
  border-style: dashed;
}
</style>
