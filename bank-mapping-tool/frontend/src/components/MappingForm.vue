<template>
  <form class="space-y-6" @submit.prevent="handleSubmit" aria-describedby="mapping-form-hint">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="form-label" for="bank_name">Bankname *</label>
        <input
          id="bank_name"
          v-model.trim="form.bank_name"
          type="text"
          required
          minlength="2"
          maxlength="64"
          class="form-input"
          placeholder="z. B. Musterbank AG"
        />
        <p v-if="errors.bank_name" class="form-error">{{ errors.bank_name }}</p>
      </div>
      <div>
        <FieldList
          v-model:list="form.booking_date"
          label="Buchungsdatum (Spalten oder Platzhalter)"
          placeholder="Datum oder $1"
        />
      </div>
      <div>
        <FieldList v-model:list="form.amount" label="Betrag" placeholder="Betrag oder $3" />
      </div>
      <div class="sm:col-span-2">
        <FieldList
          v-model:list="form.booking_text"
          label="Buchungstext"
          placeholder="Verwendungszweck"
        />
      </div>
      <div class="sm:col-span-2">
        <FieldList
          v-model:list="form.booking_type"
          label="Buchungsart (optional)"
          placeholder="Type"
        />
      </div>
      <div class="sm:col-span-2">
        <label class="form-label" for="booking_date_parse_format">Datumsformat *</label>
        <input
          id="booking_date_parse_format"
          v-model.trim="form.booking_date_parse_format"
          type="text"
          class="form-input"
          placeholder="dd.MM.yyyy"
          :required="form.booking_date.length > 0"
        />
        <p v-if="errors.booking_date_parse_format" class="form-error">
          {{ errors.booking_date_parse_format }}
        </p>
      </div>
      <div class="sm:col-span-2 flex items-center justify-between bg-white/70 border border-slate-200 rounded-xl p-4">
        <label class="flex items-start gap-3">
          <input
            v-model="form.without_header"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            <span class="block text-sm font-medium text-slate-800">CSV ohne Header</span>
            <span class="block text-sm text-slate-500">Aktivieren, wenn die erste Zeile Daten enthält.</span>
          </span>
        </label>
        <button type="button" class="text-xs text-primary-600 hover:text-primary-700" @click="toggleWithoutHeader">
          {{ form.without_header ? 'Als Header markieren' : 'Als Daten markieren' }}
        </button>
      </div>
      <div class="sm:col-span-2">
        <label class="form-label">Detection Hints</label>
        <pre class="hint-box" role="region" aria-live="polite">{{ formattedHints }}</pre>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p id="mapping-form-hint" class="text-sm text-slate-500">
        Felder für Buchungsdatum, Betrag oder Buchungstext müssen mindestens einmal gefüllt sein.
      </p>
      <button
        type="submit"
        class="btn-primary"
        :disabled="loading"
      >
        <span v-if="loading" class="loader mr-2" aria-hidden="true" />
        <span>{{ loading ? 'Speichern…' : 'Mapping speichern' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { BankMappingUpsertInput } from '~shared/mappingSchema';
import FieldList from './partials/FieldList.vue';

const props = defineProps<{
  modelValue?: BankMappingUpsertInput;
  detectionHints?: Record<string, unknown>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: BankMappingUpsertInput): void;
  (e: 'submit', value: BankMappingUpsertInput): void;
}>();

const form = reactive<BankMappingUpsertInput>({
  bank_name: '',
  booking_date: [],
  amount: [],
  booking_text: [],
  booking_type: [],
  booking_date_parse_format: '',
  without_header: false,
  detection_hints: {}
});

const errors = reactive<Record<string, string | null>>({
  bank_name: null,
  booking_date_parse_format: null
});

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      Object.assign(form, value);
    }
  },
  { immediate: true }
);

watch(
  form,
  () => {
    emit('update:modelValue', { ...form });
  },
  { deep: true }
);

const formattedHints = computed(() => JSON.stringify(props.detectionHints ?? form.detection_hints, null, 2));

const loading = computed(() => props.loading ?? false);

const toggleWithoutHeader = () => {
  form.without_header = !form.without_header;
};

const validate = () => {
  errors.bank_name = form.bank_name.length >= 2 ? null : 'Der Bankname muss mindestens 2 Zeichen besitzen.';
  const hasField = form.booking_date.length + form.amount.length + form.booking_text.length > 0;
  if (!hasField) {
    errors.bank_name = errors.bank_name ?? 'Bitte mindestens ein Feld zuordnen.';
  }
  errors.booking_date_parse_format =
    form.booking_date.length && !form.booking_date_parse_format
      ? 'Bitte Datumsformat angeben.'
      : null;
  return !errors.bank_name && !errors.booking_date_parse_format;
};

const handleSubmit = () => {
  if (!validate()) return;
  emit('submit', { ...form });
};
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-slate-600 mb-2;
}

.form-input {
  @apply w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white;
}

.form-error {
  @apply mt-1 text-sm text-rose-500;
}

.btn-primary {
  @apply inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-200 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300;
}

.loader {
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 9999px;
  width: 1rem;
  height: 1rem;
  animation: spin 0.8s linear infinite;
}

.hint-box {
  @apply bg-slate-900 text-slate-100 text-xs rounded-xl p-4 overflow-auto max-h-60 whitespace-pre-wrap;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
