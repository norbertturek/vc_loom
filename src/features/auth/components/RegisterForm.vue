<template>
  <Card class="w-[400px] mx-auto">
    <CardHeader>
      <CardTitle>Create an account</CardTitle>
      <CardDescription>Enter your details to create a new account.</CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Name</Label>
          <Input id="name" v-model="name" type="text" required />
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
          {{ isLoading ? 'Creating account...' : 'Create account' }}
        </Button>
      </form>
    </CardContent>
    <CardFooter>
      <p class="text-sm text-muted-foreground">
        Already have an account?
        <router-link to="/login" class="text-primary hover:underline">Login</router-link>
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
const name = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  isLoading.value = true
  
  // Mock registration - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  router.push('/login')
  isLoading.value = false
}
</script> 