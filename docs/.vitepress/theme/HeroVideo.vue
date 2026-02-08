<script setup lang="ts">
const videoSources = {
  webm: '/video/hero.webm',
  mp4: '/video/hero.mp4',
};
</script>

<template>
  <div class="hero-video">
    <video
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
    >
      <source :src="videoSources.webm" type="video/webm" />
      <source :src="videoSources.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<style scoped>
.hero-video {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.hero-video video {
  width: 100%;
  height: auto;
  border-radius: 12px;
  object-fit: cover;
}
</style>
