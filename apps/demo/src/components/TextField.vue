<template>
  <div class="card">
    <div class="card-label">Text</div>
    <input
      class="text-input"
      :value="store.text"
      placeholder="Type something..."
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { store } from '../store';
import { updateState } from '../sync';

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  updateState({ text: val });
}
</script>
