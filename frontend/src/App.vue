<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'

const { restoreSession } = useAuth()

onMounted(() => {
  void restoreSession()
})
</script>

<template>
  <RouterView />
</template>
