<script setup lang="ts">
import { MoonStar, SunMedium } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <main class="min-h-screen bg-background text-foreground">
    <div class="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-6">
      <header class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-muted-foreground">
            Theme demo
          </p>
          <h1 class="text-2xl font-semibold tracking-tight">
            Light and dark mode
          </h1>
        </div>

        <Button
          variant="outline"
          size="icon"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <SunMedium
            v-if="isDark"
            class="h-4 w-4"
          />
          <MoonStar
            v-else
            class="h-4 w-4"
          />
        </Button>
      </header>

      <section class="grid gap-4 md:grid-cols-2">
        <div class="rounded-lg border bg-card p-6 text-card-foreground">
          <p class="text-sm text-muted-foreground">
            This panel follows the theme tokens from your CSS variables.
          </p>
          <p class="mt-3 text-base">
            Switch the class on <code>.dark</code> and the whole app updates.
          </p>
        </div>

        <div class="rounded-lg border bg-card p-6 text-card-foreground">
          <p class="text-sm text-muted-foreground">
            The current mode is
          </p>
          <p class="mt-3 text-base font-medium">
            {{ isDark ? 'Dark' : 'Light' }}
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
