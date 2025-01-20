<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Screen Recorder</h1>
      <p class="text-muted-foreground">Record your screen and share with your team.</p>
    </div>
    <ScreenRecorder />
  </div>
</template>

<script setup lang="ts">
import ScreenRecorder from '@/features/screen-recorder/components/ScreenRecorder.vue'
</script> 