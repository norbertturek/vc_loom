export interface RecordingOptions {
  includeWebcam: boolean
  includeAudio: boolean
  selectedWebcam: string
  selectedMicrophone: string
}

export interface DeviceState {
  videoDevices: MediaDeviceInfo[]
  audioDevices: MediaDeviceInfo[]
}

export interface RecordingState {
  isRecording: boolean
  isLoading: boolean
  error: string | null
  recordedVideo: string | null
}

export type DeviceType = 'webcam' | 'microphone' 