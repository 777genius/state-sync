<script setup lang="ts">
import { useRouter } from 'vitepress';

const { go } = useRouter();

const frameworks = [
  { name: 'Zustand', link: '/packages/zustand', color: '#433e38' },
  { name: 'Pinia', link: '/packages/pinia', color: '#ffd859' },
  { name: 'Valtio', link: '/packages/valtio', color: '#764abc' },
  { name: 'Svelte', link: '/packages/svelte', color: '#ff3e00' },
  { name: 'Vue', link: '/packages/vue', color: '#42b883' },
  { name: 'Tauri', link: '/packages/tauri', color: '#ffc131' },
  { name: 'Electron', link: '/packages/electron', color: '#47848f' },
];

function navigate(link: string) {
  go(link);
}
</script>

<template>
  <div class="framework-grid">
    <button
      v-for="fw in frameworks"
      :key="fw.name"
      class="framework-card"
      @click="navigate(fw.link)"
    >
      <span class="framework-logo">
        <!-- Zustand (bear paw) -->
        <svg v-if="fw.name === 'Zustand'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="6" r="2.5" :fill="fw.color" class="icon-fill"/>
          <circle cx="17" cy="6" r="2.5" :fill="fw.color" class="icon-fill"/>
          <circle cx="4" cy="12" r="2" :fill="fw.color" class="icon-fill"/>
          <circle cx="20" cy="12" r="2" :fill="fw.color" class="icon-fill"/>
          <ellipse cx="12" cy="14" rx="6" ry="7" :fill="fw.color" class="icon-fill"/>
          <ellipse cx="9.5" cy="13" rx="1.5" ry="2" fill="white" opacity="0.3"/>
          <ellipse cx="14.5" cy="13" rx="1.5" ry="2" fill="white" opacity="0.3"/>
        </svg>
        <!-- Pinia (pineapple) -->
        <svg v-else-if="fw.name === 'Pinia'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C9.5 3 7.5 5 7.5 7.5V8C6 8 5 9.5 5 11.5C5 14 6.5 16 8 17.5C9.5 19 11 20 12 21C13 20 14.5 19 16 17.5C17.5 16 19 14 19 11.5C19 9.5 18 8 16.5 8V7.5C16.5 5 14.5 3 12 3Z" fill="#42b883"/>
          <path d="M12 3C10.5 3 9 4 8.5 5.5C9.5 4.5 10.7 4 12 4C13.3 4 14.5 4.5 15.5 5.5C15 4 13.5 3 12 3Z" fill="#35495e"/>
          <path d="M10 1.5C10.5 0.5 11 0 12 0C13 0 13.5 0.5 14 1.5L13 3H11L10 1.5Z" fill="#42b883" opacity="0.7"/>
        </svg>
        <!-- Valtio (proxy/crystal ball) -->
        <svg v-else-if="fw.name === 'Valtio'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="none" :stroke="fw.color" stroke-width="1.5" class="icon-stroke"/>
          <circle cx="12" cy="12" r="6" fill="none" :stroke="fw.color" stroke-width="1.5" class="icon-stroke"/>
          <circle cx="12" cy="12" r="2" :fill="fw.color" class="icon-fill"/>
          <line x1="12" y1="2" x2="12" y2="6" :stroke="fw.color" stroke-width="1.5" class="icon-stroke"/>
          <line x1="12" y1="18" x2="12" y2="22" :stroke="fw.color" stroke-width="1.5" class="icon-stroke"/>
          <line x1="2" y1="12" x2="6" y2="12" :stroke="fw.color" stroke-width="1.5" class="icon-stroke"/>
          <line x1="18" y1="12" x2="22" y2="12" :stroke="fw.color" stroke-width="1.5" class="icon-stroke"/>
        </svg>
        <!-- Svelte -->
        <svg v-else-if="fw.name === 'Svelte'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.68 3.17a6.33 6.33 0 0 0-8.7-1.67L7.24 4.72a5.21 5.21 0 0 0-2.36 3.5 5.44 5.44 0 0 0 .53 3.59 5.2 5.2 0 0 0-.78 1.94 5.55 5.55 0 0 0 .95 4.22 6.33 6.33 0 0 0 8.7 1.67l4.74-3.22a5.21 5.21 0 0 0 2.36-3.5 5.44 5.44 0 0 0-.53-3.59 5.2 5.2 0 0 0 .78-1.94 5.55 5.55 0 0 0-.95-4.22z" :fill="fw.color"/>
          <path d="M10.07 19.61a3.88 3.88 0 0 1-4.16-1.53 3.39 3.39 0 0 1-.58-2.58 3.3 3.3 0 0 1 .13-.53l.12-.33.3.22a6.13 6.13 0 0 0 1.85 1l.18.05-.02.18a1.03 1.03 0 0 0 .2.72 1.19 1.19 0 0 0 1.28.47 1.1 1.1 0 0 0 .31-.13l4.74-3.22a1 1 0 0 0 .46-.68 1.04 1.04 0 0 0-.18-.79 1.19 1.19 0 0 0-1.28-.47 1.1 1.1 0 0 0-.31.13l-1.81 1.23a3.6 3.6 0 0 1-1 .42 3.88 3.88 0 0 1-4.16-1.53 3.39 3.39 0 0 1-.58-2.58 3.27 3.27 0 0 1 1.49-2.21l4.74-3.22a3.6 3.6 0 0 1 1-.42 3.88 3.88 0 0 1 4.16 1.53 3.39 3.39 0 0 1 .58 2.58 3.3 3.3 0 0 1-.13.53l-.12.33-.3-.22a6.13 6.13 0 0 0-1.85-1l-.18-.05.02-.18a1.03 1.03 0 0 0-.2-.72 1.19 1.19 0 0 0-1.28-.47 1.1 1.1 0 0 0-.31.13L9.43 9.48a1 1 0 0 0-.46.68 1.04 1.04 0 0 0 .18.79 1.19 1.19 0 0 0 1.28.47 1.1 1.1 0 0 0 .31-.13l1.81-1.23a3.6 3.6 0 0 1 1-.42 3.88 3.88 0 0 1 4.16 1.53 3.39 3.39 0 0 1 .58 2.58 3.27 3.27 0 0 1-1.49 2.21l-4.74 3.22a3.6 3.6 0 0 1-1 .42z" fill="white"/>
        </svg>
        <!-- Vue -->
        <svg v-else-if="fw.name === 'Vue'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 3h4l6 10.1L18 3h4L12 21.5z" :fill="fw.color"/>
          <path d="M6.8 3h4.4L12 4.8 12.8 3h4.4L12 13.2z" fill="#35495e"/>
        </svg>
        <!-- Tauri -->
        <svg v-else-if="fw.name === 'Tauri'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="7.5" r="5.5" fill="none" :stroke="fw.color" stroke-width="2" class="icon-stroke"/>
          <circle cx="9" cy="16.5" r="5.5" fill="none" :stroke="fw.color" stroke-width="2" class="icon-stroke"/>
          <circle cx="15" cy="7.5" r="2" :fill="fw.color" class="icon-fill"/>
          <circle cx="9" cy="16.5" r="2" :fill="fw.color" class="icon-fill"/>
        </svg>
        <!-- Electron -->
        <svg v-else-if="fw.name === 'Electron'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="2.5" :fill="fw.color" class="icon-fill"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" :stroke="fw.color" stroke-width="1.2" class="icon-stroke"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" :stroke="fw.color" stroke-width="1.2" transform="rotate(60 12 12)" class="icon-stroke"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" :stroke="fw.color" stroke-width="1.2" transform="rotate(120 12 12)" class="icon-stroke"/>
        </svg>
      </span>
      <span class="framework-name">{{ fw.name }}</span>
    </button>
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
  font-weight: 500;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s, background-color 0.25s, transform 0.2s;
}

.framework-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.framework-logo {
  display: flex;
  align-items: center;
  width: 20px;
  height: 20px;
}

.framework-logo svg {
  width: 20px;
  height: 20px;
}

.dark .icon-fill {
  opacity: 0.9;
}

.dark .icon-stroke {
  opacity: 0.9;
}

.framework-name {
  line-height: 1;
}
</style>
