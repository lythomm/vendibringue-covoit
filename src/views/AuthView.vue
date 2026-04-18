<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

const router = useRouter()

const firstName = ref('')
const phone = ref('')
const pin = ref('')
const loading = ref(false)
const errorMsg = ref('')

const isFormValid = computed(() => {
  return firstName.value.length >= 2 && 
         phone.value.length >= 10 && 
         pin.value.length === 4
})

const handleAuth = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  errorMsg.value = ''
  
  try {
    // Logic will be connected to supabase in the next step
    // For now, we simulate a successful login
    await new Promise(resolve => setTimeout(resolve, 1500))
    router.push('/')
  } catch (e) {
    errorMsg.value = "Une erreur est survenue lors de l'accès à la Bringue."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-surface flex flex-col items-center justify-center p-0 sm:p-6">
    <!-- Desktop/Tablet Card -->
    <div class="w-full max-w-md sm:my-8">
      <BaseCard class="min-h-screen sm:min-h-0 flex flex-col p-6 sm:p-8">
        <!-- Header -->
        <header class="flex flex-col items-start mb-8 pt-4 sm:pt-0">
          <div class="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-brand-primary/20">
            <span class="material-symbols-outlined text-white text-2xl" data-icon="celebration">celebration</span>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight text-brand-on-surface mb-2 font-display">
            Prêt pour la Bringue ?
          </h1>
          <p class="text-brand-on-surface/60 text-base leading-relaxed">
            Identifie-toi pour voir qui propose un trajet ou pour annoncer ton départ.
          </p>
        </header>

        <!-- Form -->
        <form @submit.prevent="handleAuth" class="flex-grow flex flex-col gap-4">
          <BaseInput
            id="firstName"
            v-model="firstName"
            label="Ton prénom"
            placeholder="Ex: Thomas"
            autocomplete="given-name"
          />

          <BaseInput
            id="phone"
            v-model="phone"
            type="tel"
            label="Numéro de téléphone"
            placeholder="06 12 34 56 78"
            autocomplete="tel"
          />

          <BaseInput
            id="pin"
            v-model="pin"
            type="tel"
            label="Code PIN de la soirée (4 chiffres)"
            placeholder="• • • •"
            maxlength="4"
          />

          <div v-if="errorMsg" class="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {{ errorMsg }}
          </div>

          <div class="mt-auto sm:mt-6 pt-4">
            <BaseButton 
              type="submit" 
              :disabled="!isFormValid" 
              :loading="loading"
            >
              Rejoindre la Bringue
            </BaseButton>
          </div>
        </form>

        <!-- Footer -->
        <footer class="mt-8 text-center sm:text-left">
          <p class="text-xs text-brand-on-surface/40 leading-relaxed">
            En continuant, tu confirmes être invité à l'événement. <br class="hidden sm:block" />
            Tes coordonnées sont partagées uniquement avec les covoitureurs.
          </p>
        </footer>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
/* Focus transition for the PIN field specifically if needed */
:deep(input[id="pin"]) {
  letter-spacing: 0.5em;
  text-align: center;
  font-weight: bold;
}
:deep(input[id="pin"]::placeholder) {
  letter-spacing: normal;
}
</style>
