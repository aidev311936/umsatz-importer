<template>
  <div class="space-y-3">
    <label class="form-label">{{ label }}</label>
    <div class="space-y-2">
      <div v-for="(value, index) in list" :key="index" class="flex items-center gap-2">
        <input
          v-model="mutableList[index]"
          type="text"
          class="form-input flex-1"
          :placeholder="placeholder"
        />
        <button
          type="button"
          class="px-3 py-2 text-xs font-medium text-rose-500 hover:text-rose-600"
          @click="remove(index)"
          aria-label="Eintrag entfernen"
        >
          Entfernen
        </button>
      </div>
      <p v-if="!list.length" class="text-xs text-slate-400">Noch kein Eintrag vorhanden.</p>
    </div>
    <button type="button" class="text-xs font-medium text-primary-600 hover:text-primary-700" @click="add">
      + Eintrag hinzufügen
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  list: string[];
  label: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:list', value: string[]): void;
}>();

const mutableList = computed({
  get: () => props.list,
  set: (value: string[]) => emit('update:list', value.filter((entry) => entry.trim().length > 0))
});

const add = () => {
  emit('update:list', [...props.list, '']);
};

const remove = (index: number) => {
  const next = [...props.list];
  next.splice(index, 1);
  emit('update:list', next);
};
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-slate-600;
}
</style>
