<template>
  <div class="video-player-page">
    <div class="grid grid-cols-[2fr,1fr] gap-6 max-w-[1600px] mx-auto p-6">
      <!-- Left column: Video and transcription -->
      <div class="space-y-6">
        <div class="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref="videoRef"
            :src="videoUrl"
            class="w-full h-full"
            controls
            @timeupdate="handleTimeUpdate"
          />
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h2 class="text-xl font-semibold mb-4">Transcription</h2>
          <div class="space-y-4">
            <div
              v-for="(caption, index) in transcription"
              :key="index"
              class="flex gap-4 p-2 hover:bg-gray-50 rounded cursor-pointer"
              :class="{ 'bg-blue-50': currentTime >= caption.startTime && currentTime < caption.endTime }"
              @click="seekTo(caption.startTime)"
            >
              <span class="text-sm text-gray-500 whitespace-nowrap">
                {{ formatTime(caption.startTime) }}
              </span>
              <p>{{ caption.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: Comments -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Comments</h2>
          </div>

          <div class="space-y-4">
            <div
              v-for="comment in sortedComments"
              :key="comment.id"
              class="flex gap-4 p-4 rounded-lg border"
            >
              <button
                class="text-sm text-blue-600 whitespace-nowrap"
                @click="seekTo(comment.timestamp)"
              >
                {{ formatTime(comment.timestamp) }}
              </button>
              <div class="flex-1">
                <p class="font-medium">{{ comment.author }}</p>
                <p class="mt-1 text-gray-600">{{ comment.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'

interface Comment {
  id: string
  timestamp: number
  text: string
  author: string
  createdAt: Date
}

interface Caption {
  startTime: number
  endTime: number
  text: string
}

const route = useRoute()
const router = useRouter()
const { toast } = useToast()

const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const comments = ref<Comment[]>([])
const transcription = ref<Caption[]>([])

// TODO: Fetch these from API using the share token
const videoUrl = computed(() => {
  const { videoId, token } = route.params
  return `${videoId}?token=${token}`
})

const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => a.timestamp - b.timestamp)
})

function handleTimeUpdate() {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

function seekTo(time: number) {
  if (videoRef.value) {
    videoRef.value.currentTime = time
    videoRef.value.play()
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

onMounted(async () => {
  try {
    // TODO: Implement API call to validate share token and fetch video data
    const { videoId, token } = route.params
    if (!videoId || !token) {
      throw new Error('Invalid share link')
    }

    // TODO: Fetch video data, comments, and transcription from API
  } catch (error) {
    toast({
      title: 'Error',
      description: 'This share link is invalid or has expired',
      variant: 'destructive'
    })
    router.push('/')
  }
})
</script> 