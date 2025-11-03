<template>
  <section class="py-12">
    <div class="max-w-6xl mx-auto px-4 space-y-10">
      <div class="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div class="space-y-8">
          <div class="card bg-white/80 p-6 border border-slate-100">
            <h2 class="text-lg font-semibold text-slate-800">1. CSV hochladen</h2>
            <p class="text-sm text-slate-500 mb-4">
              Lade einen Auszug deiner Bankumsätze im CSV-Format hoch, um ein passendes Mapping vorzuschlagen.
            </p>
            <FileDrop @csv-loaded="onCsvLoaded" />
            <div v-if="fileMeta" class="mt-4 text-sm text-slate-500 flex items-center gap-3">
              <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600">{{ fileMeta.name }}</span>
              <span>{{ fileMeta.size }}</span>
            </div>
            <div class="mt-4 flex items-center gap-3">
              <input
                v-model.trim="userBankGuess"
                type="text"
                placeholder="Optionale Bankvermutung eingeben"
                class="form-input flex-1"
                aria-label="Optionale Bankvermutung"
              />
              <button
                type="button"
                class="btn-secondary"
                :disabled="!csvContent || mappingsStore.detectionLoading"
                @click="runDetection"
              >
                <span v-if="mappingsStore.detectionLoading" class="loader mr-2" aria-hidden="true" />
                <span>Automatisch erkennen</span>
              </button>
            </div>
            <p v-if="detectionError" class="mt-3 text-sm text-rose-500">{{ detectionError }}</p>
          </div>

          <div v-if="mappingForm" class="card bg-white/90 p-6 border border-slate-100 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-800">2. Vorschlag prüfen & anpassen</h2>
                <p class="text-sm text-slate-500">Passe die Felder an und speichere das Mapping dauerhaft.</p>
              </div>
              <BankGuessBadge
                v-if="mappingsStore.detection?.bankGuess"
                :label="mappingsStore.detection?.bankGuess?.label ?? ''"
                :confidence="mappingsStore.detection?.bankGuess?.confidence"
              />
            </div>
            <MappingForm
              v-model="mappingForm"
              :detection-hints="mappingsStore.detection?.mapping.detection_hints"
              :loading="saving"
              @submit="save"
            />
          </div>

          <div class="card bg-white/80 p-6 border border-slate-100">
            <h2 class="text-lg font-semibold text-slate-800">3. Bestehende Mappings</h2>
            <p class="text-sm text-slate-500">Suche nach bestehenden Banken, um sie zu vergleichen oder zu aktualisieren.</p>
            <div class="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                v-model.trim="search"
                type="search"
                class="form-input flex-1"
                placeholder="Bankname suchen"
                aria-label="Bankname suchen"
              />
              <button type="button" class="btn-secondary" @click="mappingsStore.loadMappings()">
                Aktualisieren
              </button>
            </div>
            <div class="mt-4 max-h-64 overflow-auto divide-y divide-slate-100">
              <div
                v-for="mapping in filteredMappings"
                :key="mapping.id ?? mapping.bank_name"
                class="py-3 flex items-center justify-between"
              >
                <div>
                  <p class="text-sm font-semibold text-slate-700">{{ mapping.bank_name }}</p>
                  <p class="text-xs text-slate-400">Zuletzt aktualisiert: {{ formatDate(mapping.updated_on) }}</p>
                </div>
                <button type="button" class="text-xs text-primary-600 hover:text-primary-700" @click="loadIntoForm(mapping)">
                  Laden
                </button>
              </div>
              <p v-if="!filteredMappings.length" class="text-sm text-slate-400 py-6 text-center">Keine Einträge gefunden.</p>
            </div>
          </div>
        </div>

        <aside class="space-y-6">
          <div class="card bg-gradient-to-br from-primary-600 to-primary-700 text-white p-6">
            <h3 class="text-lg font-semibold">So funktioniert die Erkennung</h3>
            <ol class="mt-4 space-y-3 text-sm leading-relaxed">
              <li><span class="font-semibold">1.</span> CSV hochladen – wir analysieren Struktur, Delimiter und Header.</li>
              <li><span class="font-semibold">2.</span> KI schlägt Felder für Datum, Betrag und Text vor.</li>
              <li><span class="font-semibold">3.</span> Prüfen, anpassen und als Mapping speichern.</li>
            </ol>
          </div>
          <div class="card bg-white/80 p-6 border border-slate-100 space-y-3">
            <h3 class="text-base font-semibold text-slate-800">Tipps für optimale Ergebnisse</h3>
            <ul class="space-y-2 text-sm text-slate-500">
              <li>CSV sollte möglichst die Originalstruktur der Bank behalten.</li>
              <li>Optionalen Banknamen angeben, falls bekannt.</li>
              <li>Datumsformat nach Bedarf mit den üblichen Moment.js Tokens definieren.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import FileDrop from '../components/FileDrop.vue';
import MappingForm from '../components/MappingForm.vue';
import BankGuessBadge from '../components/BankGuessBadge.vue';
import { useMappingsStore } from '../store/useMappingsStore';
import { useToasts } from '../store/useToasts';
import type { BankMapping, BankMappingUpsertInput } from '~shared/mappingSchema';

const mappingsStore = useMappingsStore();
const toasts = useToasts();

const csvContent = ref<string>('');
const fileMeta = ref<{ name: string; size: string } | null>(null);
const userBankGuess = ref('');
const detectionError = ref<string | null>(null);
const mappingForm = ref<BankMappingUpsertInput | null>(null);
const saving = ref(false);
const search = ref('');

onMounted(() => {
  mappingsStore.loadMappings();
});

watch(
  () => mappingsStore.detection,
  (detection) => {
    if (detection?.mapping) {
      mappingForm.value = {
        bank_name: '',
        booking_date: detection.mapping.booking_date,
        amount: detection.mapping.amount,
        booking_text: detection.mapping.booking_text,
        booking_type: detection.mapping.booking_type,
        booking_date_parse_format: detection.mapping.booking_date_parse_format,
        without_header: detection.mapping.without_header,
        detection_hints: detection.mapping.detection_hints
      };
    }
  },
  { deep: true }
);

const onCsvLoaded = (payload: { csv: string; name: string; sizeLabel: string }) => {
  csvContent.value = payload.csv;
  fileMeta.value = { name: payload.name, size: payload.sizeLabel };
  detectionError.value = null;
};

const runDetection = async () => {
  if (!csvContent.value) return;
  detectionError.value = null;
  try {
    await mappingsStore.detectFromCsv({
      csv: csvContent.value,
      userBankGuess: userBankGuess.value || undefined
    });
    toasts.success('Erkennung abgeschlossen', 'Die Vorschlagsdaten wurden geladen.');
  } catch (error: any) {
    const message = error?.response?.data?.message ?? error?.message ?? 'Erkennung fehlgeschlagen.';
    detectionError.value = message;
    toasts.error('Erkennung fehlgeschlagen', message);
  }
};

const save = async (data: BankMappingUpsertInput) => {
  saving.value = true;
  try {
    const payload = {
      ...data,
      bank_name: data.bank_name.trim()
    };
    await mappingsStore.saveMapping(payload);
    toasts.success('Mapping gespeichert', `${payload.bank_name} wurde aktualisiert.`);
  } catch (error: any) {
    const message = error?.response?.data?.message ?? error?.message ?? 'Speichern fehlgeschlagen.';
    toasts.error('Speichern fehlgeschlagen', message);
  } finally {
    saving.value = false;
  }
};

const filteredMappings = computed(() => {
  const term = search.value.toLowerCase();
  return mappingsStore.items.filter((item) => item.bank_name.toLowerCase().includes(term));
});

const formatDate = (value?: string) => {
  if (!value) return 'Unbekannt';
  return new Date(value).toLocaleString('de-DE');
};

const loadIntoForm = (mapping: BankMapping) => {
  mappingForm.value = {
    bank_name: mapping.bank_name,
    booking_date: [...mapping.booking_date],
    amount: [...mapping.amount],
    booking_text: [...mapping.booking_text],
    booking_type: [...mapping.booking_type],
    booking_date_parse_format: mapping.booking_date_parse_format,
    without_header: mapping.without_header,
    detection_hints: mapping.detection_hints
  };
  toasts.info('Mapping geladen', `${mapping.bank_name} kann nun bearbeitet werden.`);
};
</script>

<style scoped>
.form-input {
  @apply w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white;
}

.btn-secondary {
  @apply inline-flex items-center justify-center rounded-full border border-primary-200 px-5 py-2 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400;
}

.loader {
  border: 2px solid rgba(99, 102, 241, 0.25);
  border-top-color: #4f46e5;
  border-radius: 9999px;
  width: 1rem;
  height: 1rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
