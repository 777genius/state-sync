<template>
  <div class="card">
    <div class="card-label">Counter</div>
    <div class="counter-row">
      <button class="btn btn-icon" @click="updateState({ counter: store.counter - 1 })">−</button>
      <span class="counter-value">{{ store.counter }}</span>
      <button class="btn btn-icon" @click="updateState({ counter: store.counter + 1 })">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { store } from '../store';
import { updateState } from '../sync';
</script>
