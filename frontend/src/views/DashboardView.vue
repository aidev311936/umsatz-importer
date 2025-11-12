<template>
  <div class="min-h-screen bg-slate-100">
    <header class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Bank-Mappings</h1>
          <p class="text-sm text-slate-500">Verwalten Sie Zuordnungen für CSV-Exporte.</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="secondary" type="button" @click="logout">Logout</button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
        <BankMappingList
          :items="mappings"
          :selected-id="selectedMapping?.id || null"
          @select="handleSelect"
          @create-new="createDraft"
          @search="loadMappings"
        />

        <div class="space-y-6">
          <section class="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold">CSV importieren</h2>
                <p class="text-sm text-slate-500">Analysieren Sie eine CSV-Datei, um die Struktur zu erkennen.</p>
              </div>
              <form class="flex flex-col md:flex-row md:items-center gap-3" @submit.prevent="handleAnalysis">
                <input type="file" accept=".csv" @change="onFileChange" class="w-full md:w-auto" />
                <input v-model="delimiter" maxlength="1" class="w-16 text-center" placeholder=";" />
                <button class="primary" type="submit" :disabled="!csvFile">Analyse starten</button>
              </form>
            </div>
            <CsvAnalysisPreview :analysis="csvAnalysis" class="mt-6" />
          </section>

          <section class="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <BankMappingEditor
              v-model="draftMapping"
              :saving="saving"
              @save="handleSave"
              @request-ai="handleAiSuggestion"
            >
              <template #actions>
                <button
                  v-if="draftMapping?.id"
                  class="secondary text-xs"
                  type="button"
                  @click="loadOriginal"
                >
                  Änderungen verwerfen
                </button>
              </template>
            </BankMappingEditor>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BankMappingList from '../components/BankMappingList.vue';
import BankMappingEditor from '../components/BankMappingEditor.vue';
import CsvAnalysisPreview from '../components/CsvAnalysisPreview.vue';
import {
  analyzeCsv,
  createBankMapping,
  fetchBankMapping,
  fetchBankMappings,
  requestAiSuggestion,
  updateBankMapping,
} from '../services/api.js';

const router = useRouter();
const mappings = ref([]);
const selectedMapping = ref(null);
const draftMapping = ref(null);
const csvFile = ref(null);
const csvAnalysis = ref(null);
const delimiter = ref(';');
const saving = ref(false);
const currentSearch = ref('');
let latestRequestToken = 0;

const loadMappings = async (search = currentSearch.value) => {
  const requestToken = ++latestRequestToken;
  const results = await fetchBankMappings(search);
  if (requestToken !== latestRequestToken) {
    return;
  }

  currentSearch.value = search;
  mappings.value = results;

  if (selectedMapping.value) {
    const exists = mappings.value.find((item) => item.id === selectedMapping.value.id);
    if (!exists) {
      selectedMapping.value = null;
    }
  }
};

const loadOriginal = async () => {
  if (!selectedMapping.value?.id) return;
  const data = await fetchBankMapping(selectedMapping.value.id);
  selectedMapping.value = data;
  draftMapping.value = JSON.parse(JSON.stringify(data));
};

const handleSelect = async (mapping) => {
  selectedMapping.value = mapping;
  await loadOriginal();
};

const createDraft = () => {
  const base = {
    id: null,
    bank_name: '',
    booking_date: [],
    amount: [],
    booking_text: [],
    booking_type: [],
    booking_date_parse_format: csvAnalysis.value?.booking_date_parse_format || '',
    without_header: csvAnalysis.value?.without_header ?? false,
    detection_hints: csvAnalysis.value
      ? csvAnalysis.value.without_header
        ? {
            without_header: {
              column_count: csvAnalysis.value.column_count,
              column_markers: csvAnalysis.value.column_markers,
            },
          }
        : {
            header_signature: csvAnalysis.value.header_signature,
          }
      : {},
  };
  draftMapping.value = JSON.parse(JSON.stringify(base));
  selectedMapping.value = null;
};

const onFileChange = (event) => {
  const [file] = event.target.files || [];
  csvFile.value = file || null;
};

const handleAnalysis = async () => {
  if (!csvFile.value) return;
  csvAnalysis.value = await analyzeCsv({ file: csvFile.value, delimiter: delimiter.value });
  if (draftMapping.value) {
    draftMapping.value.booking_date_parse_format = csvAnalysis.value.booking_date_parse_format;
    draftMapping.value.without_header = csvAnalysis.value.without_header;
    draftMapping.value.detection_hints = csvAnalysis.value.without_header
      ? {
          without_header: {
            column_count: csvAnalysis.value.column_count,
            column_markers: csvAnalysis.value.column_markers,
          },
        }
      : {
          header_signature: csvAnalysis.value.header_signature,
        };
  }
};

const handleSave = async () => {
  if (!draftMapping.value) return;
  saving.value = true;
  try {
    const payload = JSON.parse(JSON.stringify(draftMapping.value));
    let saved;
    if (payload.id) {
      saved = await updateBankMapping(payload.id, payload);
    } else {
      saved = await createBankMapping(payload);
    }
    selectedMapping.value = saved;
    draftMapping.value = JSON.parse(JSON.stringify(saved));
    await loadMappings();
  } finally {
    saving.value = false;
  }
};

const handleAiSuggestion = async () => {
  if (!csvFile.value && !csvAnalysis.value) {
    alert('Bitte laden Sie zuerst eine CSV-Datei hoch.');
    return;
  }
  try {
    const { data, analysis } = await requestAiSuggestion({
      file: csvFile.value,
      delimiter: delimiter.value,
      additionalContext: {
        bank_name: draftMapping.value?.bank_name,
      },
    });
    if (analysis) {
      csvAnalysis.value = analysis;
    }
    draftMapping.value = {
      ...(draftMapping.value || {}),
      ...data,
      detection_hints: data.detection_hints || draftMapping.value?.detection_hints || {},
    };
  } catch (error) {
    console.error(error);
    alert('Konnte keinen KI-Vorschlag abrufen. Details siehe Konsole.');
  }
};

const logout = () => {
  localStorage.removeItem('supportToken');
  router.push({ name: 'login' });
};

onMounted(async () => {
  await loadMappings();
});

watch(
  () => draftMapping.value,
  (value) => {
    if (!value) return;
    if (value.id) {
      selectedMapping.value = value;
    }
  },
  { deep: true }
);
</script>
