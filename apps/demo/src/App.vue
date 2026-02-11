<template>
  <div class="stack">
    <div class="header">
      <h1>{{ windowLabel }}</h1>
      <span class="badge">revision #{{ store.revision }}</span>
    </div>
    <div class="divider" />
    <AutoPlay />
    <Counter />
    <ColorPicker />
    <Slider />
    <TextField />
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted, onUnmounted, ref } from 'vue';
import AutoPlay from './components/AutoPlay.vue';
import ColorPicker from './components/ColorPicker.vue';
import Counter from './components/Counter.vue';
import Slider from './components/Slider.vue';
import TextField from './components/TextField.vue';
import { store } from './store';
import { createDemoSync } from './sync';

const sync = createDemoSync();

const LABELS: Record<string, string> = {
  'demo-a': 'Window A',
  'demo-b': 'Window B',
  'demo-c': 'Window C',
};
const windowLabel = ref('');

onMounted(async () => {
  const win = getCurrentWindow();
  windowLabel.value = LABELS[win.label] ?? win.label;
  await sync.start();
});

onUnmounted(() => {
  sync.stop();
});
</script>
