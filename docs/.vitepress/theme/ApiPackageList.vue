<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import { packageIcons } from './package-icons';

const { isDark } = useData();

const packages = [
  { slug: 'core', name: 'Core', full: '@statesync/core' },
  { slug: 'persistence', name: 'Persistence', full: '@statesync/persistence' },
  { slug: 'pinia', name: 'Pinia', full: '@statesync/pinia' },
  { slug: 'redux', name: 'Redux', full: '@statesync/redux' },
  { slug: 'zustand', name: 'Zustand', full: '@statesync/zustand' },
  { slug: 'jotai', name: 'Jotai', full: '@statesync/jotai' },
  { slug: 'mobx', name: 'MobX', full: '@statesync/mobx' },
  { slug: 'valtio', name: 'Valtio', full: '@statesync/valtio' },
  { slug: 'svelte', name: 'Svelte', full: '@statesync/svelte' },
  { slug: 'vue', name: 'Vue', full: '@statesync/vue' },
  { slug: 'tauri', name: 'Tauri', full: '@statesync/tauri' },
  { slug: 'electron', name: 'Electron', full: '@statesync/electron' },
];

function iconSrc(slug: string) {
  const icon = packageIcons[slug];
  if (!icon) return '';
  return isDark.value && icon.dark ? icon.dark : icon.light;
}
</script>

<template>
  <div class="api-package-list">
    <a
      v-for="pkg in packages"
      :key="pkg.slug"
      :href="withBase(`/api/${pkg.slug}/`)"
      class="api-package-item"
    >
      <img :src="iconSrc(pkg.slug)" :alt="pkg.name" class="api-package-icon" />
      <span class="api-package-name">{{ pkg.name }}</span>
      <span class="api-package-full">{{ pkg.full }}</span>
    </a>
  </div>
</template>

<style scoped>
.api-package-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 16px 0;
}

.api-package-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--vp-c-text-1);
  text-decoration: none !important;
  transition: background-color 0.2s;
}

.api-package-item:hover {
  background: var(--vp-c-bg-soft);
}

.api-package-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.api-package-name {
  font-weight: 600;
  font-size: 15px;
}

.api-package-full {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
</style>
