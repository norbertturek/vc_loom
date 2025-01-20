<template>
  <Card class="w-[400px] mx-auto">
    <CardHeader>
      <CardTitle>Create an account</CardTitle>
      <CardDescription>Enter your details to create a new account.</CardDescription>
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
            placeholder="Choose a password"
            required
          />
          <p class="text-sm text-muted-foreground">
            Password must be at least 6 characters long
          </p>
        </div>

        <div v-if="localError" class="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {{ localError }}
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ loading ? 'Creating account...' : 'Create account' }}
        </Button>

        <div class="text-sm text-center text-muted-foreground">
          Already have an account?
          <router-link to="/login" class="text-primary hover:underline">
            Sign in
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const email = ref('')
const password = ref('')
const localError = ref('')
const { signUp, loading, error } = useAuth()

function validateEmail(email: string) {
  return email.includes('@') && email.includes('.')
}

async function handleSubmit() {
  if (!validateEmail(email.value)) {
    localError.value = 'Please enter a valid email address'
    return
  }

  if (password.value.length < 6) {
    localError.value = 'Password must be at least 6 characters long'
    return
  }

  await signUp({ 
    email: email.value, 
    password: password.value,
    full_name: email.value.split('@')[0]
  })
}
</script> 