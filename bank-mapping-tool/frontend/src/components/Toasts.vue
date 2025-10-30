<template>
  <div class="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 flex flex-col gap-3 z-50">
    <TransitionGroup name="toast" tag="div">
      <div
        v-for="toast in toasts.items"
        :key="toast.id"
        class="card bg-white/90 backdrop-blur border border-slate-100 px-4 py-3 shadow-xl flex items-start gap-3"
        role="status"
        :aria-label="toast.title"
      >
        <div :class="iconClass(toast.type)" class="mt-1 flex h-2 w-2 rounded-full" aria-hidden="true" />
        <div class="flex-1">
          <p class="text-sm font-semibold text-slate-800">{{ toast.title }}</p>
          <p v-if="toast.description" class="text-sm text-slate-500 mt-1">{{ toast.description }}</p>
        </div>
        <button
          type="button"
          class="text-xs text-slate-400 hover:text-slate-600"
          @click="toasts.dismiss(toast.id)"
        >
          schließen
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from '../store/useToasts';

const toasts = useToasts();

const iconClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-500';
    case 'error':
      return 'bg-rose-500';
    default:
      return 'bg-primary-500';
  }
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
