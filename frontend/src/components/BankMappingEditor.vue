<template>
  <div v-if="modelValue" class="space-y-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <label class="block text-sm font-medium text-slate-600">Bankname</label>
        <input v-model="draft.bank_name" placeholder="Bankname" class="mt-1 w-full lg:w-80" />
      </div>
      <div class="flex gap-2">
        <button class="secondary" type="button" @click="emit('request-ai')">
          KI-Vorschlag anfordern
        </button>
        <button class="primary" type="button" @click="save" :disabled="saving">
          <span v-if="saving">Speichern…</span>
          <span v-else>Speichern</span>
        </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <FieldEditor
        v-for="field in fieldDefinitions"
        :key="field.key"
        :label="field.label"
        v-model="draft[field.key]"
        :help="field.help"
      />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <input type="checkbox" v-model="draft.without_header" /> CSV ohne Kopfzeile
        </label>
        <div>
          <label class="block text-sm font-medium text-slate-600">Datumsformat</label>
          <input
            v-model="draft.booking_date_parse_format"
            placeholder="z. B. dd.MM.yyyy"
            class="mt-1 w-full"
          />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Detection Hints (JSON)</label>
        <textarea
          v-model="detectionHints"
          class="mt-1 w-full min-h-[120px] font-mono text-xs"
          placeholder="{ }"
        ></textarea>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <div class="text-xs text-slate-500">Zuletzt aktualisiert: {{ formatDate(modelValue.updated_on) }}</div>
      <slot name="actions"></slot>
    </div>
  </div>
  <p v-else class="text-sm text-slate-500">Wählen Sie ein Mapping aus oder legen Sie ein neues an.</p>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import FieldEditor from './FieldEditor.vue';

const props = defineProps({
  modelValue: { type: Object, default: null },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'save', 'request-ai']);

const draft = reactive({
  id: null,
  bank_name: '',
  booking_date: [],
  amount: [],
  booking_text: [],
  booking_type: [],
  booking_date_parse_format: '',
  without_header: false,
  detection_hints: {},
});

const detectionHints = computed({
  get() {
    try {
      return JSON.stringify(draft.detection_hints ?? {}, null, 2);
    } catch (error) {
      console.error('Could not stringify detection hints', error);
      return '{}';
    }
  },
  set(value) {
    try {
      draft.detection_hints = value ? JSON.parse(value) : {};
    } catch (error) {
      console.warn('Invalid JSON for detection hints');
    }
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return;
    Object.assign(draft, JSON.parse(JSON.stringify(value)));
  },
  { immediate: true }
);

watch(
  draft,
  () => {
    emit('update:modelValue', JSON.parse(JSON.stringify(draft)));
  },
  { deep: true }
);

const fieldDefinitions = [
  {
    key: 'booking_date',
    label: 'Buchungsdatum',
    help: 'Spaltennamen oder Positionen (z. B. $1) je Zeile – eine pro Zeile.',
  },
  { key: 'booking_text', label: 'Buchungstext', help: 'Mehrere Zeilen werden concatenated.' },
  { key: 'amount', label: 'Betrag', help: 'Spaltennamen oder Positionen für Beträge.' },
  { key: 'booking_type', label: 'Buchungsart', help: 'Optional – Art der Buchung.' },
];

const formatDate = (value) => {
  if (!value) return 'Unbekannt';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const save = () => {
  emit('save');
};
</script>
