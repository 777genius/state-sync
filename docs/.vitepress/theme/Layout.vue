<script setup lang="ts">
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed, nextTick, provide } from 'vue';
import { useCodeblockCollapse } from './codeblockCollapse';
import { useMermaidZoom } from './mermaidZoom';
import HeroVideo from './HeroVideo.vue';

const { Layout } = DefaultTheme;
const { isDark, page } = useData();

const pagePath = computed(() => page.value.relativePath);
useCodeblockCollapse(pagePath);
useMermaidZoom(pagePath);

const enableTransitions = () =>
  'startViewTransition' in document &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value;
    return;
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    )}px at ${x}px ${y}px)`,
  ];

  await (document as any).startViewTransition(async () => {
    isDark.value = !isDark.value;
    await nextTick();
  }).ready;

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPath.reverse() : clipPath },
    {
      duration: 300,
      easing: 'ease-in',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
    },
  );
});
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <HeroVideo />
    </template>
  </Layout>
</template>
