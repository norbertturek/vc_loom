<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useRouter, useRoute } from 'vue-router'

const { getUser, loading, user } = useAuth()
const router = useRouter()
const route = useRoute()

const showLoader = computed(() => {
  return loading.value && route.meta.requiresAuth && !user.value
})

onMounted(async () => {
  try {
    await getUser()
  } catch (error) {
    console.error('Auth initialization error:', error)
  }
})
</script>

<template>
  <router-view v-if="!showLoader" />
  <div v-else class="flex items-center justify-center min-h-screen">
    <Loader2 class="h-8 w-8 animate-spin" />
  </div>
</template>

<style>
body {
  margin: 0;
  background-color: #f3f4f6;
}
</style>
