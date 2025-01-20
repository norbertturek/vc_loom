<template>
  <Card class="w-[400px] mx-auto">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Enter your email and password to access your account.</CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input 
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="error" class="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {{ error }}
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </Button>

        <div class="text-sm text-center text-muted-foreground">
          Don't have an account?
          <router-link to="/register" class="text-primary hover:underline">
            Sign up
          </router-link>
        </div>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const email = ref('')
const password = ref('')
const { signIn, loading, error } = useAuth()

async function handleSubmit() {
  await signIn({ email: email.value, password: password.value })
}
</script> 