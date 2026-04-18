<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Simple logic to check session, redirect to auth if not logged in
})
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-brand-secondary text-white p-4 shadow-md flex justify-between items-center">
      <h1 class="text-xl font-display font-bold">VB Covoit'</h1>
      <button class="bg-white/20 px-3 py-1 rounded-full text-sm">Profil</button>
    </header>

    <!-- Map Placeholder -->
    <div class="flex-1 bg-slate-200 relative overflow-hidden flex items-center justify-center">
       <div class="text-slate-500 flex flex-col items-center">
          <div class="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="font-medium">Chargement de la carte...</p>
       </div>
    </div>

    <!-- Bottom Actions -->
    <div class="p-4 bg-white border-t border-slate-200 flex gap-4">
       <button class="flex-1 bg-brand-primary text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform">
         Conducteur
       </button>
       <button class="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl active:scale-95 transition-transform">
         Passager
       </button>
    </div>
  </div>
</template>
