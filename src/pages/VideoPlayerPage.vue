<template>
  <div class="video-player-page">
    <div class="grid grid-cols-[2fr,1fr] gap-6 max-w-[1600px] mx-auto p-6">
      <!-- Left column: Video -->
      <div class="space-y-6">
        <!-- Video Title and Duration -->
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <Input
              v-if="isEditingTitle"
              v-model="editedTitle"
              class="text-2xl font-bold w-full"
              @keyup.enter="saveVideoTitle"
              @blur="saveVideoTitle"
              ref="titleInputRef"
            />
            <h1 
              v-else 
              class="text-2xl font-bold cursor-pointer hover:text-blue-600"
              @click="startEditingTitle"
            >
              {{ videoTitle || 'Untitled Recording' }}
            </h1>
            <p v-if="duration" class="text-sm text-gray-500 mt-1">
              Duration: {{ formatTime(duration) }}
            </p>
          </div>
          <Button v-if="!isEditingTitle" @click="startEditingTitle" variant="ghost" size="sm">
            <PencilIcon class="h-4 w-4" />
          </Button>
        </div>

        <div class="relative aspect-video bg-black rounded-lg overflow-hidden group">
          <video
            ref="videoRef"
            :src="videoSrc"
            class="w-full h-full"
            controls
            @timeupdate="handleTimeUpdate"
            @loadedmetadata="handleVideoLoaded"
            preload="auto"
            crossorigin="anonymous"
            playsinline
          >
            <source :src="videoSrc" type="video/webm">
            Your browser does not support the video tag.
          </video>
          
          <!-- Custom Progress Bar -->
          <div 
            ref="progressBarRef"
            class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 cursor-pointer"
            @click="handleProgressBarClick"
          >
            <div 
              class="h-full bg-blue-600 transition-all duration-100"
              :style="{ width: `${(currentTime / (duration || 1)) * 100}%` }"
            />
          </div>
          
          <!-- Video Captions -->
          <div 
            v-if="currentTranscript"
            class="absolute bottom-16 left-0 right-0 flex justify-center px-4 video-captions"
          >
            <div 
              class="bg-black/75 text-white px-4 py-2 rounded-lg text-lg max-w-[80%] text-center"
              :class="{ 'opacity-75': currentTranscript.interim }"
            >
              {{ currentTranscript.text }}
            </div>
          </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
  Trash2Icon,
  PencilIcon
} from 'lucide-vue-next'

const route = useRoute()
const { user: currentUser } = useAuth()
const { toast } = useToast()

const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const showCommentDialog = ref(false)
const newCommentText = ref('')
const isEditingTitle = ref(false)
const editedTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)
const duration = ref(0)

const {
  isLoading,
  error,
  videoUrl,
  comments,
  transcription,
  shareLink,
  title,
  fetchVideoData,
  addComment,
  deleteComment,
  generateShareLink,
  updateTitle
} = useVideoPlayer(route.params.videoId as string)

// Update videoTitle to use the title from the backend
const videoTitle = computed(() => title.value)

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
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
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

// Update currentTranscript computed to handle seconds
const currentTranscript = computed(() => {
  if (!transcription.value) return null
  
  return transcription.value.find(t => 
    currentTime.value >= t.start_time && 
    currentTime.value < t.end_time
  ) as Transcript | null
})

// Update sortedComments to use the Comment type
const sortedComments = computed((): Comment[] => {
  return [...comments.value].sort((a, b) => a.timestamp - b.timestamp)
})

// Add cleanup on component unmount
onUnmounted(() => {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.src = ''
    videoRef.value.load()
  }
})

// Optimize video loading
onMounted(() => {
  if (videoRef.value) {
    videoRef.value.addEventListener('loadedmetadata', () => {
      // Set video buffer size to 2 minutes
      if ('buffered' in videoRef.value!) {
        const bufferSize = 120 // 2 minutes in seconds
        videoRef.value!.preload = 'auto'
        // @ts-ignore - mozPreservesPitch is a non-standard property
        videoRef.value!.mozPreservesPitch = false
        // @ts-ignore - webkitPreservesPitch is a non-standard property
        videoRef.value!.webkitPreservesPitch = false
      }
    })
  }
})

onMounted(async () => {
  await fetchVideoData()
})

function startEditingTitle() {
  editedTitle.value = videoTitle.value
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

async function saveVideoTitle() {
  if (editedTitle.value.trim() !== videoTitle.value) {
    try {
      await updateTitle(editedTitle.value.trim())
      toast({
        title: 'Success',
        description: 'Video title updated'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update video title',
        variant: 'destructive'
      })
    }
  }
  isEditingTitle.value = false
}

function handleVideoLoaded(event: Event) {
  const video = event.target as HTMLVideoElement
  if (video) {
    // Wait for duration to be available
    if (isFinite(video.duration)) {
      duration.value = video.duration
    } else {
      // If duration not immediately available, wait for loadeddata
      video.addEventListener('loadeddata', () => {
        duration.value = video.duration
      }, { once: true })
    }
  }
}

// Add custom progress bar
const progressBarRef = ref<HTMLDivElement | null>(null)

function handleProgressBarClick(event: MouseEvent) {
  if (!videoRef.value || !progressBarRef.value) return
  
  const rect = progressBarRef.value.getBoundingClientRect()
  const clickPosition = event.clientX - rect.left
  const percentage = clickPosition / rect.width
  const newTime = percentage * videoRef.value.duration
  
  if (isFinite(newTime)) {
    videoRef.value.currentTime = newTime
  }
}
</script>

<style scoped>
.video-player-page {
  position: relative;
}

/* Make captions visible in fullscreen */
.video-captions {
  z-index: 2147483647; /* Maximum z-index value */
}

:deep(video::-webkit-media-text-track-container) {
  transform: translateY(-40px);
}

/* Ensure captions are visible in fullscreen */
:fullscreen .video-captions,
::backdrop .video-captions {
  position: fixed;
  bottom: 60px;
}

/* Progress bar styles */
.progress-bar {
  transition: height 0.2s;
}

.group:hover .progress-bar {
  height: 4px;
}
</style> 