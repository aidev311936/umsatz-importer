<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <input
        v-model="query"
        type="search"
        placeholder="Nach Bank suchen…"
        class="flex-1"
        @input="handleSearch"
      />
      <button class="secondary" type="button" @click="$emit('create-new')">
        Neues Mapping
      </button>
    </div>
    <div class="bg-white rounded-lg shadow border border-slate-200 divide-y divide-slate-200 max-h-[60vh] overflow-y-auto">
      <button
        v-for="mapping in filteredMappings"
        :key="mapping.id"
        class="w-full text-left px-4 py-3 hover:bg-indigo-50 focus:bg-indigo-100"
        :class="{ 'bg-indigo-100': mapping.id === selectedId }"
        @click="$emit('select', mapping)"
      >
        <div class="font-medium">{{ mapping.bank_name }}</div>
        <div class="text-xs text-slate-500">Aktualisiert: {{ formatDate(mapping.updated_on) }}</div>
      </button>
      <p v-if="!filteredMappings.length" class="px-4 py-8 text-center text-sm text-slate-500">
        Keine Einträge gefunden.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  selectedId: { type: Number, default: null },
});

const emit = defineEmits(['select', 'create-new', 'search']);
const query = ref('');

const filteredMappings = computed(() => {
  if (!query.value) return props.items;
  return props.items.filter((item) =>
    item.bank_name.toLowerCase().includes(query.value.toLowerCase())
  );
});

watch(query, (value) => emit('search', value));

const handleSearch = () => {
  emit('search', query.value);
};

const formatDate = (value) => {
  if (!value) return 'Unbekannt';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};
</script>
