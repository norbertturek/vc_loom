<template>
  <div class="container mx-auto px-4 py-12">
    <div class="text-center max-w-3xl mx-auto">
      <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">
        Record your screen with ease
      </h1>
      <p class="mt-6 text-lg leading-8 text-muted-foreground">
        Create, share, and collaborate with quick screen recordings. Perfect for tutorials, bug reports, and team communication.
      </p>
      <div class="mt-10 flex items-center justify-center gap-x-6">
        <router-link to="/register">
          <Button size="lg">Get started</Button>
        </router-link>
        <a href="#features" class="text-sm font-semibold leading-6">
          Learn more <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>

    <div class="mt-16 flow-root sm:mt-24">
      <div class="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
        <img
          src="@/assets/demo-screenshot.png"
          alt="Screen recorder demo"
          class="rounded-lg shadow-xl mt-8 w-full"
        />
      </div>
    </div>

    <div id="features" class="mt-32 sm:mt-40">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl sm:text-center">
          <h2 class="text-base font-semibold leading-7">Everything you need</h2>
          <p class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Record with confidence</p>
          <p class="mt-6 text-lg leading-8 text-muted-foreground">
            Our screen recorder comes with all the features you need to create professional recordings.
          </p>
        </div>

        <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div class="flex flex-col">
              <dt class="text-base font-semibold leading-7">
                Screen + Webcam Recording
              </dt>
              <dd class="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p class="flex-auto">Record your screen with optional webcam overlay for a personal touch.</p>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-base font-semibold leading-7">
                Audio Support
              </dt>
              <dd class="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p class="flex-auto">Include microphone audio to provide clear explanations.</p>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-base font-semibold leading-7">
                Instant Sharing
              </dt>
              <dd class="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p class="flex-auto">Download and share your recordings instantly with your team.</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script> 