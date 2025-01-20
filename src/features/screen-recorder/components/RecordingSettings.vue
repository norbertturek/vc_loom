<template>
  <Card class="w-[400px] mx-auto mb-8">
    <CardHeader>
      <CardTitle>Recording Settings</CardTitle>
      <CardDescription>Choose your recording devices and options.</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid w-full items-center gap-4">
        <div class="flex flex-col space-y-1.5">
          <Label>Webcam</Label>
          <select 
            :value="webcam"
            @input="$emit('update:webcam', ($event.target as HTMLSelectElement).value)"
            :disabled="disabled"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Camera ${device.deviceId}` }}
            </option>
          </select>
        </div>
        <div class="flex flex-col space-y-1.5">
          <Label>Microphone</Label>
          <select 
            :value="microphone"
            @input="$emit('update:microphone', ($event.target as HTMLSelectElement).value)"
            :disabled="disabled"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Microphone ${device.deviceId}` }}
            </option>
          </select>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="include-webcam"
              :checked="includeWebcam"
              @input="$emit('update:include-webcam', ($event.target as HTMLInputElement).checked)"
              :disabled="disabled"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            >
            <Label for="include-webcam">Include Webcam</Label>
          </div>
          <div class="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="include-audio"
              :checked="includeAudio"
              @input="$emit('update:include-audio', ($event.target as HTMLInputElement).checked)"
              :disabled="disabled"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            >
            <Label for="include-audio">Include Audio</Label>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

defineProps<{
  webcam: string
  microphone: string
  includeWebcam: boolean
  includeAudio: boolean
  videoDevices: MediaDeviceInfo[]
  audioDevices: MediaDeviceInfo[]
  disabled: boolean
}>()

defineEmits<{
  'update:webcam': [value: string]
  'update:microphone': [value: string]
  'update:include-webcam': [value: boolean]
  'update:include-audio': [value: boolean]
}>()</script> 