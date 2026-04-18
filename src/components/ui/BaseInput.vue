<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  id: string;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <div 
      class="group relative w-full border border-brand-outline rounded-xl bg-white focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent transition-all duration-200"
      :class="{ 'border-red-500 ring-red-500': error }"
    >
      <div v-if="label" class="px-4 pt-3 pb-1">
        <label 
          :for="id" 
          class="block text-[12px] font-medium text-brand-on-surface/60 leading-tight group-focus-within:text-brand-primary"
        >
          {{ label }}
        </label>
      </div>
      <div class="px-4" :class="label ? 'pb-3' : 'py-4'">
        <input
          :id="id"
          :type="type || 'text'"
          :placeholder="placeholder"
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          class="w-full bg-transparent border-none p-0 text-base focus:ring-0 placeholder:text-brand-on-surface/30"
        />
      </div>
    </div>
    <span v-if="error" class="text-xs text-red-500 px-1">{{ error }}</span>
  </div>
</template>
