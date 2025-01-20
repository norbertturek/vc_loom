<template>
  <Card class="w-[400px] mx-auto">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Enter your email and password to access your account.</CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {{ error }}
        </div>
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="email" type="email" placeholder="m@example.com" required />
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input id="password" v-model="password" type="password" required />
        </div>
        <Button type="submit" class="w-full" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </Button>
      </form>
    </CardContent>
    <CardFooter>
      <p class="text-sm text-muted-foreground">
        Don't have an account?
        <router-link to="/register" class="text-primary hover:underline">Register</router-link>
      </p>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

async function handleSubmit() {
  isLoading.value = true
  error.value = ''
  
  // Mock login - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (email.value === 'demo@example.com' && password.value === 'password') {
    localStorage.setItem('isAuthenticated', 'true')
    router.push('/recorder')
  } else {
    error.value = 'Invalid email or password'
  }
  
  isLoading.value = false
}
</script> 