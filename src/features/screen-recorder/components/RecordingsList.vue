<template>
  <div class="recordings-list">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">Your Recordings</h2>
    </div>

    <div v-if="state.error" class="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
      {{ state.error }}
    </div>

    <div v-if="state.loading && !state.recordings.length" class="flex justify-center p-8">
      <Loader2 class="h-8 w-8 animate-spin" />
    </div>

    <div v-else-if="!state.recordings.length" class="text-center p-8 text-muted-foreground">
      No recordings yet. Start recording to see them here!
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="recording in state.recordings" :key="recording.id">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span class="truncate">{{ recording.title }}</span>
            <Button variant="ghost" size="icon" @click="handleDelete(recording.id)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            {{ new Date(recording.created_at).toLocaleDateString() }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <video 
            :src="recording.url" 
            controls 
            class="w-full rounded-md"
            preload="metadata"
          />
          <div class="mt-4 flex justify-end">
            <a 
              :href="recording.url" 
              download
              class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <Download class="h-4 w-4 mr-1" />
              Download
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2, Download } from 'lucide-vue-next'
import { useRecordings } from '../composables/useRecordings'

const { state, fetchRecordings, deleteRecording } = useRecordings()

onMounted(() => {
  fetchRecordings()
})

async function handleDelete(id: string) {
  await deleteRecording(id)
  await fetchRecordings()
}
</script> 