<template>
  <div class="screen-recorder">
    <ErrorAlert :error="error" />
    <div v-if="isLoading" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Loader2 class="h-12 w-12 animate-spin text-white" />
    </div>

    <RecordingSettings
      v-model:webcam="selectedWebcam"
      v-model:microphone="selectedMicrophone"
      v-model:include-webcam="includeWebcam"
      v-model:include-audio="includeAudio"
      :video-devices="deviceState.videoDevices"
      :audio-devices="deviceState.audioDevices"
      :disabled="isRecording"
    />

    <WebcamPreview
      v-if="includeWebcam"
      :stream="webcamStream"
      class="preview-container"
    />

    <div class="controls">
      <Button 
        @click="startRecording" 
        :disabled="isRecording"
        variant="destructive"
      >
        Start Recording
      </Button>
      <Button 
        @click="stopRecording" 
        :disabled="!isRecording"
        variant="secondary"
      >
        Stop Recording
      </Button>
    </div>

    <RecordingPreview
      v-if="recordedVideo"
      :video-url="recordedVideo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, toRefs } from 'vue'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { useScreenRecorder } from '../composables/useScreenRecorder'
import RecordingSettings from './RecordingSettings.vue'
import WebcamPreview from './WebcamPreview.vue'
import RecordingPreview from './RecordingPreview.vue'
import ErrorAlert from './ErrorAlert.vue'

const selectedWebcam = ref('')
const selectedMicrophone = ref('')
const includeWebcam = ref(true)
const includeAudio = ref(true)

const {
  state,
  deviceState,
  webcamStream,
  getDevices,
  startWebcamPreview,
  startRecording: startRec,
  stopRecording,
  cleanup
} = useScreenRecorder()

const { isRecording, recordedVideo, error, isLoading } = toRefs(state.value)

async function handleDeviceSetup() {
  await getDevices()
  
  if (deviceState.value.videoDevices.length > 0) {
    selectedWebcam.value = deviceState.value.videoDevices[0].deviceId
    if (includeWebcam.value) {
      await startWebcamPreview(selectedWebcam.value)
    }
  }
  
  if (deviceState.value.audioDevices.length > 0) {
    selectedMicrophone.value = deviceState.value.audioDevices[0].deviceId
  }
}

async function startRecording() {
  await startRec({
    includeWebcam: includeWebcam.value,
    includeAudio: includeAudio.value,
    selectedWebcam: selectedWebcam.value,
    selectedMicrophone: selectedMicrophone.value
  })
}

onMounted(() => {
  handleDeviceSetup()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.screen-recorder {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.preview-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}
</style> 