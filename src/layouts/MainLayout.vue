<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="text-xl font-bold">Loom</router-link>
        
        <div class="flex items-center gap-4">
          <template v-if="isAuthenticated">
            <Button @click="logout" variant="ghost">Logout</Button>
          </template>
          <template v-else>
            <router-link to="/login">
              <Button variant="ghost">Login</Button>
            </router-link>
            <router-link to="/register">
              <Button variant="default">Get Started</Button>
            </router-link>
          </template>
        </div>
      </nav>
    </header>

    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'

const router = useRouter()
const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true')

function logout() {
  localStorage.removeItem('isAuthenticated')
  isAuthenticated.value = false
  router.push('/login')
}
</script> 