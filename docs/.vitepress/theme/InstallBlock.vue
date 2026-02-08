<script setup lang="ts">
import { ref } from 'vue';

const command = 'npm install @statesync/core';
const copied = ref(false);

async function copy() {
  await navigator.clipboard.writeText(command);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <div class="install-block" @click="copy">
    <code>$ {{ command }}</code>
    <span class="copy-hint">{{ copied ? 'Copied!' : 'Click to copy' }}</span>
  </div>
</template>

<style scoped>
.install-block {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 12px 20px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.25s, background-color 0.25s;
  font-size: 15px;
}

.install-block:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-mute);
}

.install-block code {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}

.copy-hint {
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}
</style>
