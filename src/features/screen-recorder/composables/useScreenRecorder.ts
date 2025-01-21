import { ref } from 'vue'
import type { RecordingOptions, DeviceState, RecordingState } from '../types'
import { FILE_DEFAULTS, WEBCAM_PREVIEW } from '../constants'

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface RecorderState {
  isRecording: boolean
  isLoading: boolean
  error: string | null
  recordedVideo: string | null
  recognition: SpeechRecognition | null
}

export function useScreenRecorder() {
  const state = ref<RecorderState>({
    isRecording: false,
    isLoading: false,
    error: null,
    recordedVideo: null,
    recognition: null
  })

  const deviceState = ref<DeviceState>({
    videoDevices: [],
    audioDevices: []
  })

  const mediaRecorder = ref<MediaRecorder | null>(null)
  const recordedChunks = ref<Blob[]>([])
  const webcamStream = ref<MediaStream | null>(null)
  const transcripts = ref<Array<{
    start_time: number,
    end_time: number,
    text: string,
    interim?: boolean
  }>>([])

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
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    
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

    let lastDrawTime = 0
    const targetFPS = 30
    const frameInterval = 1000 / targetFPS

    function drawFrame(timestamp: number) {
      if (!ctx) return
      
      // Implement frame rate limiting
      const elapsed = timestamp - lastDrawTime
      if (elapsed < frameInterval) {
        requestAnimationFrame(drawFrame)
        return
      }
      
      lastDrawTime = timestamp

      // Clear the canvas before drawing new frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw screen content
      if (!screenVideo.paused && !screenVideo.ended) {
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
      }
      
      // Draw webcam PiP
      if (!webcamVideo.paused && !webcamVideo.ended) {
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
      }
      
      requestAnimationFrame(drawFrame)
    }

    requestAnimationFrame(drawFrame)
    return canvas.captureStream(targetFPS)
  }

  async function startRecording(options: RecordingOptions): Promise<void> {
    try {
      state.value.isLoading = true
      state.value.error = null
      state.value.recordedVideo = null
      state.value.isRecording = false
      transcripts.value = [] // Reset transcripts

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      }).catch(() => {
        state.value.isLoading = false
        throw new Error('Screen sharing was cancelled')
      })

      // Cleanup previous recording if exists
      if (mediaRecorder.value) {
        mediaRecorder.value.stop()
        recordedChunks.value = []
      }

      const streams: MediaStream[] = []
      let audioStream: MediaStream | null = null

      if (options.includeWebcam && webcamStream.value) {
        const canvasStream = await createCanvasStream(screenStream, webcamStream.value)
        streams.push(canvasStream)
      } else {
        streams.push(screenStream)
      }

      if (options.includeAudio && options.selectedMicrophone) {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: options.selectedMicrophone }
        })
        streams.push(audioStream)

        // Start speech recognition with the audio stream
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
          const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'

          let startTime = 0
          let currentTranscript = {
            start_time: 0,
            end_time: 0,
            text: '',
            interim: true
          }

          recognition.onstart = () => {
            console.log('Speech recognition started')
            startTime = Date.now()
          }

          recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1]
            const transcript = result[0].transcript.trim()
            const currentTime = Date.now() - startTime

            if (result.isFinal) {
              // Remove the interim version if it exists
              transcripts.value = transcripts.value.filter(t => !t.interim)
              
              if (transcript) {
                transcripts.value.push({
                  start_time: currentTranscript.start_time,
                  end_time: currentTime,
                  text: transcript,
                  interim: false
                })
                console.log('Final transcript:', transcript, 'from:', currentTranscript.start_time, 'to:', currentTime)
              }
              currentTranscript = {
                start_time: currentTime,
                end_time: currentTime,
                text: '',
                interim: true
              }
            } else {
              // Update or add interim result
              if (!currentTranscript.text && transcript) {
                // New interim transcript starting
                currentTranscript.start_time = currentTime
              }
              currentTranscript.text = transcript
              currentTranscript.end_time = currentTime

              // Update the interim transcript in the array
              const interimIndex = transcripts.value.findIndex(t => t.interim)
              if (interimIndex >= 0) {
                transcripts.value[interimIndex] = { ...currentTranscript }
              } else {
                transcripts.value.push({ ...currentTranscript })
              }
            }
          }

          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
          }

          // Store recognition instance to stop it later
          state.value.recognition = recognition
          recognition.start()
        }
      }

      const tracks = streams.flatMap(stream => stream.getTracks())
      const combinedStream = new MediaStream(tracks)

      recordedChunks.value = []
      mediaRecorder.value = new MediaRecorder(combinedStream, {
        mimeType: FILE_DEFAULTS.mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
        audioBitsPerSecond: 128000   // 128 kbps for audio
      })

      // Handle data in smaller chunks (every 250ms)
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        try {
          // Stop speech recognition if it was running
          if (state.value.recognition) {
            state.value.recognition.stop()
            state.value.recognition = null
          }

          // Create blob from chunks
          const blob = new Blob(recordedChunks.value, { 
            type: FILE_DEFAULTS.mimeType 
          })
          
          // Clean up old video URL if exists
          if (state.value.recordedVideo) {
            URL.revokeObjectURL(state.value.recordedVideo)
          }
          
          state.value.recordedVideo = URL.createObjectURL(blob)
          state.value.isRecording = false
          
          // Stop all tracks except webcam
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

      // Start recording with 250ms timeslices for smoother data handling
      mediaRecorder.value.start(250)
      state.value.isRecording = true
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to start recording'
      console.error('Error starting recording:', err)
      state.value.isRecording = false
    } finally {
      state.value.isLoading = false
    }
  }

  function stopRecording(): Promise<{ blob: Blob, transcripts: typeof transcripts.value, videoUrl: string }> {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder.value || !state.value.isRecording) {
        reject(new Error('No active recording'))
        return
      }

      mediaRecorder.value.onstop = () => {
        try {
          const blob = new Blob(recordedChunks.value, { type: FILE_DEFAULTS.mimeType })
          if (state.value.recordedVideo) {
            URL.revokeObjectURL(state.value.recordedVideo)
          }
          const videoUrl = URL.createObjectURL(blob)
          state.value.recordedVideo = videoUrl
          state.value.isRecording = false
          
          // Stop all tracks except webcam
          mediaRecorder.value?.stream.getTracks()
            .filter(track => !webcamStream.value?.getTracks().includes(track))
            .forEach(track => track.stop())
          
          recordedChunks.value = []
          resolve({ blob, transcripts: transcripts.value, videoUrl })
        } catch (err) {
          console.error('Error processing recording:', err)
          state.value.error = 'Failed to process recording'
          reject(err)
        }
      }

      mediaRecorder.value.stop()
    })
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
    state,
    deviceState,
    webcamStream,
    getDevices,
    startWebcamPreview,
    startRecording,
    stopRecording,
    cleanup
  }
} 