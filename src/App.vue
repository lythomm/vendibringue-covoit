<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="min-h-screen">
    <RouterView />
  </main>
</template>

<style>
/* Global transitions if needed */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
