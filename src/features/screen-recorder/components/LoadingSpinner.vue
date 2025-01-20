<template>
  <div v-if="isLoading" class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isLoading: boolean
}>()
</script> 