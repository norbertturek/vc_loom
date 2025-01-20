<template>
  <div v-if="error" class="fixed top-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
    <div class="flex items-center gap-2">
      <AlertCircle class="h-4 w-4 text-red-500" />
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

defineProps<{
  error: string | null
}>()
</script> 