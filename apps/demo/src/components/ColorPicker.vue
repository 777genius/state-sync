<template>
  <div class="card">
    <div class="card-label">Color</div>
    <div class="color-row">
      <button
        v-for="c in colors"
        :key="c"
        class="color-dot"
        :class="{ active: store.color === c }"
        :style="{ backgroundColor: c }"
        @click="updateState({ color: c })"
      />
    </div>
    <div class="color-preview" :style="{ backgroundColor: store.color }" />
  </div>
</template>

<script setup lang="ts">
import { store } from '../store';
import { updateState } from '../sync';

const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
</script>
