<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits(['click']);
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="disabled || loading"
    class="relative flex items-center justify-center gap-2 px-6 h-[52px] font-semibold text-base rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none w-full shadow-sm hover:shadow-md"
    :class="{
      'bg-brand-primary text-white hover:bg-brand-secondary': !variant || variant === 'primary',
      'bg-white text-brand-on-surface border border-brand-outline hover:bg-brand-surface': variant === 'outline',
      'bg-brand-surface text-brand-primary': variant === 'secondary',
      'bg-transparent text-brand-on-surface hover:bg-brand-surface': variant === 'ghost'
    }"
    @click="emit('click')"
  >
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-inherit rounded-full">
       <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
    </div>
    <slot v-else />
  </button>
</template>
