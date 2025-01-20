export const WEBCAM_PREVIEW = {
  width: { ideal: 320 },
  height: { ideal: 240 }
} as const

export const CANVAS_DEFAULTS = {
  width: 1920,
  height: 1080,
  fps: 30,
  pipScale: 0.2, // 20% of screen width
  pipAspectRatio: 4/3,
  pipPadding: 20,
  borderRadius: 16
} as const

export const FILE_DEFAULTS = {
  mimeType: 'video/webm',
  fileName: 'screen-recording.webm'
} as const 