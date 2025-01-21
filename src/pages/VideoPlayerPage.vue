<template>
  <div class="video-player-page">
    <div class="grid grid-cols-[2fr,1fr] gap-6 max-w-[1600px] mx-auto p-6">
      <!-- Left column: Video -->
      <div class="space-y-6">
        <div class="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref="videoRef"
            :src="videoSrc"
            class="w-full h-full"
            controls
            @timeupdate="handleTimeUpdate"
          />
          <VideoCaptions
            :transcription="transcription"
            :current-time="currentTime"
          />
        </div>
      </div>

      <!-- Right column: Transcription, Comments and sharing -->
      <div class="space-y-6">
        <!-- Transcription -->
        <div class="bg-white rounded-lg p-6 shadow-sm max-h-[400px] overflow-y-auto">
          <h2 class="text-xl font-semibold mb-4">Transcription</h2>
          <div class="space-y-4">
            <div
              v-for="(caption, index) in transcription"
              :key="index"
              class="flex gap-4 p-2 hover:bg-gray-50 rounded cursor-pointer"
              :class="{ 'bg-blue-50': currentTime >= caption.start_time && currentTime < caption.end_time }"
              @click="seekTo(caption.start_time)"
            >
              <span class="text-sm text-gray-500 whitespace-nowrap">
                {{ formatTime(caption.start_time) }}
              </span>
              <p>{{ caption.text }}</p>
            </div>
          </div>
        </div>

        <!-- Share Video -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Share Video</h2>
            <Button @click="handleGenerateShareLink" variant="outline" class="gap-2">
              <LinkIcon class="h-4 w-4" />
              Generate Link
            </Button>
          </div>
          
          <div v-if="shareLink" class="space-y-4">
            <div class="flex gap-2">
              <Input :value="shareLink" readonly />
              <Button @click="copyShareLink" variant="secondary">Copy</Button>
            </div>
            <p class="text-sm text-gray-500">
              Anyone with this link can view this video
            </p>
          </div>
        </div>

        <!-- Comments -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Comments</h2>
            <Button @click="openCommentDialog" variant="outline" class="gap-2">
              <MessageSquarePlusIcon class="h-4 w-4" />
              Add Comment
            </Button>
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
                <div class="flex justify-between items-start gap-4">
                  <p class="font-medium">{{ comment.user_id }}</p>
                  <button
                    v-if="comment.user_id === currentUser?.id"
                    @click="deleteComment(comment.id)"
                    class="text-gray-400 hover:text-red-500"
                  >
                    <Trash2Icon class="h-4 w-4" />
                  </button>
                </div>
                <p class="mt-1 text-gray-600">{{ comment.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Comment Dialog -->
    <Dialog :open="showCommentDialog" @close="closeCommentDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogDescription>
            Add a comment at {{ formatTime(currentTime) }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <Textarea
            v-model="newCommentText"
            placeholder="Type your comment here"
            class="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            type="button"
            @click="closeCommentDialog"
          >
            Cancel
          </Button>
          <Button
            type="button"
            @click="submitComment"
            :disabled="!newCommentText.trim()"
          >
            Add Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Real-time captions overlay -->
    <div 
      v-if="currentTranscript"
      class="absolute bottom-16 left-0 right-0 flex justify-center"
    >
      <div 
        class="bg-black/75 text-white px-4 py-2 rounded-lg text-lg max-w-[80%] text-center"
        :class="{ 'opacity-75': currentTranscript.interim }"
      >
        {{ currentTranscript.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useVideoPlayer } from '@/features/screen-recorder/composables/useVideoPlayer'
import { useToast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import VideoCaptions from '@/features/screen-recorder/components/VideoCaptions.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LinkIcon,
  MessageSquarePlusIcon,
  Trash2Icon
} from 'lucide-vue-next'

const route = useRoute()
const { user: currentUser } = useAuth()
const { toast } = useToast()

const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const showCommentDialog = ref(false)
const newCommentText = ref('')

const {
  isLoading,
  error,
  videoUrl,
  comments,
  transcription,
  shareLink,
  fetchVideoData,
  addComment,
  deleteComment,
  generateShareLink
} = useVideoPlayer(route.params.videoId as string)

// Add interfaces for our types
interface Comment {
  id: string
  recording_id: string
  user_id: string
  text: string
  timestamp: number
  created_at: string
  updated_at: string
  author?: string // Make author optional
}

interface Transcript {
  id: string
  recording_id: string
  start_time: number
  end_time: number
  text: string
  created_at: string
  interim?: boolean // Add interim flag
}

// Update videoUrl binding to handle null
const videoSrc = computed(() => videoUrl.value || '')

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

function openCommentDialog() {
  if (!currentUser.value) {
    toast({
      title: 'Authentication required',
      description: 'Please log in to add comments',
      variant: 'destructive'
    })
    return
  }
  showCommentDialog.value = true
}

function closeCommentDialog() {
  showCommentDialog.value = false
  newCommentText.value = ''
}

async function submitComment() {
  if (!newCommentText.value.trim() || !currentUser.value) return

  try {
    await addComment(newCommentText.value, currentTime.value)
    closeCommentDialog()
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to add comment',
      variant: 'destructive'
    })
  }
}

async function handleGenerateShareLink() {
  try {
    const token = await generateShareLink()
    shareLink.value = `${window.location.origin}/share/${route.params.videoId}/${token}`
  } catch (error) {
    // Error is handled in the composable
  }
}

async function copyShareLink() {
  try {
    if (!shareLink.value) return
    await navigator.clipboard.writeText(shareLink.value)
    toast({
      title: 'Success',
      description: 'Share link copied to clipboard'
    })
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to copy link',
      variant: 'destructive'
    })
  }
}

// Update currentTranscript computed to include interim
const currentTranscript = computed(() => {
  if (!transcription.value) return null
  
  const currentTimeMs = currentTime.value * 1000
  return transcription.value.find(t => 
    currentTimeMs >= t.start_time && 
    currentTimeMs <= t.end_time
  ) as Transcript | null
})

// Update sortedComments to use the Comment type
const sortedComments = computed((): Comment[] => {
  return [...comments.value].sort((a, b) => a.timestamp - b.timestamp)
})

onMounted(async () => {
  await fetchVideoData()
})
</script>

<style scoped>
/* ... existing styles ... */
</style> 