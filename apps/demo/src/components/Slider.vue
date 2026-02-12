<template>
  <div class="card">
    <div class="slider-header">
      <span class="card-label" style="margin-bottom: 0">Slider</span>
      <span class="slider-value">{{ store.sliderValue }}</span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      :value="store.sliderValue"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { store } from '../store';
import { updateState } from '../sync';

function onInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  updateState({ sliderValue: val });
}
</script>
