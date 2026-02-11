<template>
  <button
    class="btn btn-lg btn-block"
    :class="running ? 'btn-danger' : 'btn-success'"
    @click="toggle"
  >
    {{ running ? `STOP  (${phaseLabel})` : '▶  AUTO DEMO' }}
  </button>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { updateState } from '../sync';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const phaseLabels = ['Counter', 'Colors', 'Slider', 'Text', 'All'];

const running = ref(false);
const phase = ref(0);
const phaseLabel = computed(() => phaseLabels[phase.value] ?? '');

let timer: ReturnType<typeof setInterval> | null = null;
let aborted = false;

function stop() {
  running.value = false;
  aborted = true;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function toggle() {
  if (running.value) {
    stop();
    return;
  }
  running.value = true;
  aborted = false;
  runSequence();
}

async function runSequence() {
  await updateState({ counter: 0, color: COLORS[0], sliderValue: 50, text: '' });

  let tick = 0;

  // Phase 0: Counter
  phase.value = 0;
  tick = 0;
  await runPhase(50, 40, () => {
    tick++;
    updateState({ counter: tick });
  });
  if (aborted) return;

  // Phase 1: Colors
  phase.value = 1;
  tick = 0;
  await runPhase(80, 24, () => {
    updateState({ color: COLORS[tick % COLORS.length] });
    tick++;
  });
  if (aborted) return;

  // Phase 2: Slider
  phase.value = 2;
  let sv = 0;
  let dir = 3;
  await runPhase(30, 70, () => {
    sv += dir;
    if (sv >= 100) {
      sv = 100;
      dir = -3;
    }
    if (sv <= 0) {
      sv = 0;
      dir = 3;
    }
    updateState({ sliderValue: sv });
  });
  if (aborted) return;

  // Phase 3: Text
  phase.value = 3;
  tick = 0;
  const phrase = 'Real-time sync across windows!';
  await runPhase(60, phrase.length, () => {
    tick++;
    updateState({ text: phrase.slice(0, tick) });
  });
  if (aborted) return;

  // Phase 4: All together
  phase.value = 4;
  tick = 0;
  sv = 50;
  dir = 4;
  await runPhase(40, 60, () => {
    tick++;
    sv += dir;
    if (sv >= 100 || sv <= 0) dir = -dir;
    updateState({
      counter: tick,
      color: COLORS[tick % COLORS.length],
      sliderValue: Math.max(0, Math.min(100, sv)),
    });
  });

  stop();
}

function runPhase(intervalMs: number, steps: number, fn: () => void): Promise<void> {
  return new Promise((resolve) => {
    let step = 0;
    timer = setInterval(() => {
      if (aborted || step >= steps) {
        if (timer) clearInterval(timer);
        timer = null;
        resolve();
        return;
      }
      fn();
      step++;
    }, intervalMs);
  });
}

onUnmounted(() => stop());
</script>
