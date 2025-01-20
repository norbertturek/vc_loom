<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="text-xl font-bold">
          Screen Recorder
        </router-link>
        
        <nav class="flex items-center gap-4">
          <template v-if="user">
            <span class="text-sm text-muted-foreground">{{ user.email }}</span>
            <Button variant="outline" @click="handleLogout" :disabled="loading">
              <LogOut v-if="!loading" class="h-4 w-4 mr-2" />
              <Loader2 v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ loading ? 'Logging out...' : 'Logout' }}
            </Button>
          </template>
          <template v-else>
            <router-link to="/login">
              <Button variant="outline">Login</Button>
            </router-link>
            <router-link to="/register">
              <Button>Get Started</Button>
            </router-link>
          </template>
        </nav>
      </div>
    </header>

    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-vue-next'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useRouter } from 'vue-router'

const { user, signOut, getUser, loading } = useAuth()
const router = useRouter()

onMounted(async () => {
  await getUser()
})

async function handleLogout() {
  await signOut()
}
</script> 