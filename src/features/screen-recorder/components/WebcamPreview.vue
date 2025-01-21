<template>
  <div 
    ref="containerRef"
    class="webcam-container"
    :style="{ 
      left: `${position.x}px`, 
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`
    }"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <video 
      ref="videoRef" 
      autoplay 
      muted 
      playsinline 
      class="webcam-preview" 
    />
    
    <!-- Resize handles -->
    <div class="resize-handle top-left" @mousedown="startResize('top-left')" @touchstart="startResize('top-left')" />
    <div class="resize-handle top-right" @mousedown="startResize('top-right')" @touchstart="startResize('top-right')" />
    <div class="resize-handle bottom-left" @mousedown="startResize('bottom-left')" @touchstart="startResize('bottom-left')" />
    <div class="resize-handle bottom-right" @mousedown="startResize('bottom-right')" @touchstart="startResize('bottom-right')" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  stream: MediaStream | null
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// Position state
const position = ref({ x: 20, y: 20 })
const size = ref({ width: 240, height: 180 })
const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const resizeHandle = ref<string | null>(null)

watch(() => props.stream, (newStream) => {
  if (videoRef.value) {
    videoRef.value.srcObject = newStream
  }
}, { immediate: true })

function startDrag(event: MouseEvent | TouchEvent) {
  if (event.target instanceof HTMLElement && event.target.classList.contains('resize-handle')) {
    return
  }
  
  isDragging.value = true
  const pos = getEventPosition(event)
  dragStart.value = {
    x: pos.x - position.value.x,
    y: pos.y - position.value.y
  }
  
  event.preventDefault()
}

function startResize(handle: string) {
  isResizing.value = true
  resizeHandle.value = handle
}

function handleMove(event: MouseEvent | TouchEvent) {
  if (isDragging.value) {
    const pos = getEventPosition(event)
    position.value = {
      x: pos.x - dragStart.value.x,
      y: pos.y - dragStart.value.y
    }
  } else if (isResizing.value && resizeHandle.value) {
    const pos = getEventPosition(event)
    const rect = containerRef.value?.getBoundingClientRect()
    if (!rect) return

    const minWidth = 160
    const minHeight = 120
    const aspectRatio = 4/3

    switch (resizeHandle.value) {
      case 'bottom-right':
        const newWidth = Math.max(minWidth, pos.x - rect.left)
        size.value = {
          width: newWidth,
          height: newWidth / aspectRatio
        }
        break
      // Add other cases for different handles if needed
    }
  }
}

function handleEnd() {
  isDragging.value = false
  isResizing.value = false
  resizeHandle.value = null
}

function getEventPosition(event: MouseEvent | TouchEvent) {
  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY }
  } else {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    }
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleEnd)
  window.addEventListener('touchmove', handleMove)
  window.addEventListener('touchend', handleEnd)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMove)
  window.removeEventListener('mouseup', handleEnd)
  window.removeEventListener('touchmove', handleMove)
  window.removeEventListener('touchend', handleEnd)
})
</script>

<style scoped>
.webcam-container {
  position: fixed;
  z-index: 1000;
  cursor: move;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.webcam-preview {
  width: 100%;
  height: 100%;
  background-color: #000;
  object-fit: cover;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: white;
  border: 2px solid #666;
  border-radius: 50%;
}

.top-left {
  top: 4px;
  left: 4px;
  cursor: nw-resize;
}

.top-right {
  top: 4px;
  right: 4px;
  cursor: ne-resize;
}

.bottom-left {
  bottom: 4px;
  left: 4px;
  cursor: sw-resize;
}

.bottom-right {
  bottom: 4px;
  right: 4px;
  cursor: se-resize;
}
</style> 