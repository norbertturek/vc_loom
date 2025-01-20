<template>
  <video ref="videoRef" autoplay muted playsinline class="webcam-preview" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  stream: MediaStream | null
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

watch(() => props.stream, (newStream) => {
  if (videoRef.value) {
    videoRef.value.srcObject = newStream
  }
}, { immediate: true })
</script>

<style scoped>
.webcam-preview {
  width: 240px;
  height: 180px;
  background-color: #000;
  object-fit: cover;
  border-radius: 0.5rem;
}
</style> 