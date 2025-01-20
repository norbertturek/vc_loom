<script setup lang="ts">
import ScreenRecorder from '@/features/screen-recorder/components/ScreenRecorder.vue'
</script>

<template>
  <router-view></router-view>
</template>

<style>
.app {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #1f2937;
  margin-bottom: 2rem;
}

body {
  margin: 0;
  background-color: #f3f4f6;
}
</style>
