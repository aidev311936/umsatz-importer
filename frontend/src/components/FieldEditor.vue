<template>
  <div class="space-y-2">
    <div>
      <label class="block text-sm font-medium text-slate-600">{{ label }}</label>
      <textarea
        :value="lines"
        class="mt-1 w-full min-h-[120px] font-mono text-xs"
        @input="updateValue($event.target.value)"
        placeholder="Eine Zeile pro Spaltenname oder Position"
      ></textarea>
    </div>
    <p v-if="help" class="text-xs text-slate-500">{{ help }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, required: true },
  help: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const lines = computed(() => (props.modelValue || []).join('\n'));

const updateValue = (value) => {
  const arr = value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
  emit('update:modelValue', arr);
};
</script>
