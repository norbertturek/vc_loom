<template>
  <div class="container mx-auto px-4 py-12">
    <Card class="w-[400px] mx-auto">
      <CardHeader>
        <CardTitle>Account Confirmed!</CardTitle>
        <CardDescription>Your email has been verified successfully.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-center text-muted-foreground">
          You can now log in to your account.
        </p>
        <Button @click="handleLogin" class="w-full">
          Go to Login
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSupabase } from '@/features/auth/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  const supabase = getSupabase()
  // Handle the hash fragment
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  
  if (accessToken && refreshToken) {
    // Set the session
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    if (error) {
      console.error('Error setting session:', error)
    }
  }
})

function handleLogin() {
  router.push('/login')
}
</script> 