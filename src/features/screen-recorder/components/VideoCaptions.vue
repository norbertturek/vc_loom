<template>
  <div 
    class="absolute inset-x-0 bottom-16 flex justify-center pointer-events-none"
    :class="{ 'opacity-0': !currentCaption }"
  >
    <div 
      class="bg-black/75 text-white px-4 py-2 rounded-lg text-lg text-center max-w-[80%] transition-opacity duration-200"
    >
      {{ currentCaption?.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Transcription } from '@/types/database'

const props = defineProps<{
  transcription: Transcription[]
  currentTime: number
}>()

const currentCaption = computed(() => {
  return props.transcription.find(caption => 
    props.currentTime >= caption.start_time && 
    props.currentTime < caption.end_time
  )
})
</script> 