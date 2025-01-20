import { ref } from 'vue'
import type { RecordingOptions, DeviceState, RecordingState } from '../types'
import { FILE_DEFAULTS, WEBCAM_PREVIEW } from '../constants'

export function useScreenRecorder() {
  const state = ref<RecordingState>({
    isRecording: false,
    isLoading: false,
    error: null,
    recordedVideo: null
  })

  const deviceState = ref<DeviceState>({
    videoDevices: [],
    audioDevices: []
  })

  const mediaRecorder = ref<MediaRecorder | null>(null)
  const recordedChunks = ref<Blob[]>([])
  const webcamStream = ref<MediaStream | null>(null)

  async function getDevices(): Promise<void> {
    try {
      state.value.isLoading = true
      state.value.error = null
      
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      deviceState.value = {
        videoDevices: devices.filter(device => device.kind === 'videoinput'),
        audioDevices: devices.filter(device => device.kind === 'audioinput')
      }

      if (deviceState.value.videoDevices.length === 0) {
        throw new Error('No video devices found')
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to access media devices'
      console.error('Error getting devices:', err)
    } finally {
      state.value.isLoading = false
    }
  }

  async function startWebcamPreview(deviceId: string): Promise<void> {
    try {
      state.value.isLoading = true
      state.value.error = null

      if (webcamStream.value) {
        webcamStream.value.getTracks().forEach(track => track.stop())
      }

      webcamStream.value = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId,
          width: WEBCAM_PREVIEW.width,
          height: WEBCAM_PREVIEW.height
        }
      })
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to start webcam preview'
      console.error('Error starting webcam preview:', err)
    } finally {
      state.value.isLoading = false
    }
  }

  async function createCanvasStream(screenStream: MediaStream, webcamStream: MediaStream): Promise<MediaStream> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    const screenTrack = screenStream.getVideoTracks()[0]
    const { width, height } = screenTrack.getSettings()
    canvas.width = width || 1920
    canvas.height = height || 1080

    const screenVideo = document.createElement('video')
    screenVideo.srcObject = screenStream
    await screenVideo.play()

    const webcamVideo = document.createElement('video')
    webcamVideo.srcObject = webcamStream
    await webcamVideo.play()

    const pipWidth = canvas.width * 0.2
    const pipHeight = (pipWidth * 3) / 4

    function drawFrame() {
      if (!ctx) return
      
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
      ctx.save()
      
      const padding = 20
      const x = canvas.width - pipWidth - padding
      const y = canvas.height - pipHeight - padding
      const borderRadius = 16
      
      ctx.beginPath()
      ctx.moveTo(x + borderRadius, y)
      ctx.lineTo(x + pipWidth - borderRadius, y)
      ctx.quadraticCurveTo(x + pipWidth, y, x + pipWidth, y + borderRadius)
      ctx.lineTo(x + pipWidth, y + pipHeight - borderRadius)
      ctx.quadraticCurveTo(x + pipWidth, y + pipHeight, x + pipWidth - borderRadius, y + pipHeight)
      ctx.lineTo(x + borderRadius, y + pipHeight)
      ctx.quadraticCurveTo(x, y + pipHeight, x, y + pipHeight - borderRadius)
      ctx.lineTo(x, y + borderRadius)
      ctx.quadraticCurveTo(x + borderRadius, y, x + borderRadius, y)
      ctx.closePath()
      
      ctx.clip()
      ctx.drawImage(webcamVideo, x, y, pipWidth, pipHeight)
      ctx.restore()
      
      requestAnimationFrame(drawFrame)
    }

    drawFrame()
    return canvas.captureStream(30)
  }

  async function startRecording(options: RecordingOptions): Promise<void> {
    try {
      state.value.isLoading = true
      state.value.error = null
      state.value.recordedVideo = null

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      }).catch(() => {
        throw new Error('Screen sharing was cancelled')
      })

      // Cleanup previous recording if exists
      if (mediaRecorder.value) {
        mediaRecorder.value.stop()
        recordedChunks.value = []
      }

      const streams: MediaStream[] = []

      if (options.includeWebcam && webcamStream.value) {
        const canvasStream = await createCanvasStream(screenStream, webcamStream.value)
        streams.push(canvasStream)
      } else {
        streams.push(screenStream)
      }

      if (options.includeAudio && options.selectedMicrophone) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: options.selectedMicrophone }
        })
        streams.push(audioStream)
      }

      const tracks = streams.flatMap(stream => stream.getTracks())
      const combinedStream = new MediaStream(tracks)

      recordedChunks.value = []
      mediaRecorder.value = new MediaRecorder(combinedStream)
      
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        try {
          const blob = new Blob(recordedChunks.value, { type: FILE_DEFAULTS.mimeType })
          if (state.value.recordedVideo) {
            URL.revokeObjectURL(state.value.recordedVideo)
          }
          state.value.recordedVideo = URL.createObjectURL(blob)
          state.value.isRecording = false
          
          tracks
            .filter(track => !webcamStream.value?.getTracks().includes(track))
            .forEach(track => track.stop())
          
          recordedChunks.value = []
        } catch (err) {
          console.error('Error processing recording:', err)
          state.value.error = 'Failed to process recording'
        }
      }

      mediaRecorder.value.onerror = (event: Event) => {
        const mediaError = event as { error?: { message?: string } }
        state.value.error = 'Recording failed: ' + (mediaError.error?.message || 'Unknown error')
        stopRecording()
      }

      mediaRecorder.value.start()
      state.value.isRecording = true
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to start recording'
      console.error('Error starting recording:', err)
      state.value.isRecording = false
    } finally {
      state.value.isLoading = false
    }
  }

  function stopRecording(): void {
    if (mediaRecorder.value && state.value.isRecording) {
      mediaRecorder.value.stop()
    }
  }

  function cleanup(): void {
    if (webcamStream.value) {
      webcamStream.value.getTracks().forEach(track => track.stop())
      webcamStream.value = null
    }
    if (mediaRecorder.value) {
      if (mediaRecorder.value.state !== 'inactive') {
        mediaRecorder.value.stop()
      }
      mediaRecorder.value = null
    }
    if (state.value.recordedVideo) {
      URL.revokeObjectURL(state.value.recordedVideo)
      state.value.recordedVideo = null
    }
    recordedChunks.value = []
    state.value.isRecording = false
    state.value.error = null
  }

  return {
    ...state.value,
    deviceState,
    webcamStream,
    getDevices,
    startWebcamPreview,
    startRecording,
    stopRecording,
    cleanup
  }
} 