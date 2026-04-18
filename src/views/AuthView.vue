<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import BaseButton from "@/components/ui/BaseButton.vue";

const router = useRouter();
const auth = useAuthStore();

const firstName = ref("");
const phone = ref("");
const pinDigits = ref(["", "", "", ""]);
const pinInputs = ref<HTMLInputElement[]>([]);
const loading = ref(false);
const errorMsg = ref("");

const pin = computed(() => pinDigits.value.join(""));

const isFormValid = computed(() => {
  return (
    firstName.value.trim().length >= 2 &&
    phone.value.replace(/\s/g, "").length >= 10 &&
    /^\d{4}$/.test(pin.value)
  );
});

const handlePinInput = (index: number, event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  // Keep only the last character if multiple are entered
  if (value.length > 1) {
    pinDigits.value[index] = value.slice(-1);
  }

  if (pinDigits.value[index] && index < 3) {
    nextTick(() => {
      pinInputs.value[index + 1].focus();
    });
  }
};

const handlePinKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === "Backspace" && !pinDigits.value[index] && index > 0) {
    nextTick(() => {
      pinInputs.value[index - 1].focus();
    });
  }
};

const handleAuth = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  errorMsg.value = "";

  try {
    await auth.loginOrRegister(firstName.value.trim(), phone.value, pin.value);
    router.push("/");
  } catch (e: any) {
    errorMsg.value =
      e.message || "Une erreur est survenue lors de l'accès à la Bringue.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-brand-surface text-brand-on-surface font-body selection:bg-brand-primary/10 overflow-x-hidden"
  >
    <main class="relative min-h-screen flex items-center justify-center p-4">
      <!-- Background Decoration -->
      <div
        class="fixed inset-0 -z-10 overflow-hidden opacity-20 pointer-events-none"
      >
        <div
          class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-primary filter blur-[120px]"
        ></div>
        <div
          class="absolute top-[60%] -right-[5%] w-[30%] h-[30%] rounded-full bg-brand-outline filter blur-[100px]"
        ></div>
      </div>

      <!-- Auth Card -->
      <section class="relative z-10 w-full max-w-[480px]">
        <div
          class="bg-white rounded-[2rem] p-8 md:p-12 border border-brand-outline/30 shadow-xl shadow-brand-primary/5"
        >
          <!-- Brand Identity -->
          <div class="mb-10 flex flex-col items-center">
            <span
              class="text-2xl font-black tracking-tighter text-brand-primary mb-1"
              >VendiCovoit</span
            >
            <div class="h-1 w-6 bg-brand-primary rounded-full"></div>
          </div>

          <header class="mb-8 text-center">
            <h1
              class="text-2xl md:text-3xl font-bold text-brand-on-surface leading-tight tracking-tight mb-2"
            >
              Bienvenue sur Vendibringue
            </h1>
            <p class="text-brand-on-surface/50 font-medium text-base">
              Le covoit' sûr et flex pour ta soirée.
            </p>
          </header>

          <form @submit.prevent="handleAuth" class="w-full space-y-6">
            <!-- Prénom Input -->
            <div class="space-y-2">
              <label
                class="block text-left text-[10px] font-bold uppercase tracking-[0.15em] text-brand-on-surface/60 pl-1"
                for="firstName"
              >
                Ton Prénom
              </label>
              <div class="relative group">
                <span
                  class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-brand-on-surface/30 group-focus-within:text-brand-primary transition-colors"
                  >person</span
                >
                <input
                  id="firstName"
                  v-model="firstName"
                  class="w-full h-14 pl-12 pr-4 bg-white border border-brand-outline/40 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-brand-on-surface transition-all outline-none placeholder:text-brand-on-surface/20 font-medium"
                  placeholder="Ex: Olivier"
                  type="text"
                  required
                />
              </div>
            </div>

            <!-- Phone Number Input -->
            <div class="space-y-2">
              <label
                class="block text-left text-[10px] font-bold uppercase tracking-[0.15em] text-brand-on-surface/60 pl-1"
                for="phone"
              >
                Numéro de téléphone
              </label>
              <div class="relative group">
                <span
                  class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-brand-on-surface/30 group-focus-within:text-brand-primary transition-colors"
                  >smartphone</span
                >
                <input
                  id="phone"
                  v-model="phone"
                  class="w-full h-14 pl-12 pr-4 bg-white border border-brand-outline/40 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-brand-on-surface transition-all outline-none placeholder:text-brand-on-surface/20 font-medium font-mono"
                  placeholder="06 12 34 56 78"
                  type="tel"
                  required
                />
              </div>
            </div>

            <!-- PIN Input Grid -->
            <div class="space-y-2">
              <label
                class="block text-left text-[10px] font-bold uppercase tracking-[0.15em] text-brand-on-surface/60 pl-1"
              >
                Code PIN à 4 chiffres
              </label>
              <div class="grid grid-cols-4 gap-3">
                <input
                  v-for="(digit, idx) in pinDigits"
                  :key="idx"
                  ref="pinInputs"
                  v-model="pinDigits[idx]"
                  @input="handlePinInput(idx, $event)"
                  @keydown="handlePinKeydown(idx, $event)"
                  maxlength="1"
                  type="text"
                  inputmode="numeric"
                  class="h-14 bg-white border border-brand-outline/40 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-center text-xl font-bold rounded-xl outline-none text-brand-on-surface transition-all"
                />
              </div>
              <!-- <div class="flex justify-end items-center px-1 mt-2">
                <button
                  class="text-[11px] text-brand-on-surface/40 font-bold underline underline-offset-4 hover:text-brand-primary transition-colors cursor-pointer"
                  type="button"
                >
                  Code oublié ?
                </button>
              </div> -->
            </div>

            <!-- Error Message -->
            <div
              v-if="errorMsg"
              class="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] font-medium animate-in fade-in slide-in-from-top-1"
            >
              {{ errorMsg }}
            </div>

            <!-- CTA Button -->
            <BaseButton
              type="submit"
              :disabled="!isFormValid"
              :loading="loading"
              class="w-full h-14 mt-4 !shadow-lg !shadow-brand-primary/20"
            >
              C'est parti !
            </BaseButton>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

.animate-in {
  animation: animate-in 0.3s ease-out;
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
