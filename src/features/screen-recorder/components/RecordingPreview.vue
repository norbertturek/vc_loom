<template>
  <div class="flex flex-col items-center gap-4">
    <video :src="videoUrl" controls class="w-full max-w-[800px] rounded-lg" />
    <a 
      :href="videoUrl" 
      download="screen-recording.webm"
      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    >
      Download Recording
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  videoUrl: string
}>()</script> 