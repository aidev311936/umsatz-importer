<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
    :class="badgeClass"
  >
    <span class="h-2 w-2 rounded-full" :class="dotClass" aria-hidden="true" />
    <span class="sr-only">Bank-Vermutung:</span>
    <span>{{ label }}</span>
    <span v-if="confidence !== undefined" class="text-[0.65rem] text-slate-500 font-semibold">
      {{ Math.round(confidence * 100) }}%
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  confidence?: number;
}>();

const badgeClass = computed(() =>
  props.confidence && props.confidence >= 0.75
    ? 'bg-emerald-50 text-emerald-700'
    : props.confidence && props.confidence >= 0.4
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-600'
);

const dotClass = computed(() =>
  props.confidence && props.confidence >= 0.75
    ? 'bg-emerald-500'
    : props.confidence && props.confidence >= 0.4
      ? 'bg-amber-400'
      : 'bg-slate-400'
);
</script>
