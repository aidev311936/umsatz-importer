<template>
  <div
    class="border-2 border-dashed border-primary-200 rounded-2xl p-6 bg-white/70 transition hover:border-primary-400"
    :class="{ 'border-primary-500 bg-white shadow-lg': isDragging }"
    @dragenter.prevent="onDrag"
    @dragover.prevent="onDrag"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="flex flex-col items-center text-center gap-3">
      <svg class="h-12 w-12 text-primary-500" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3a1 1 0 0 1 .894.553l1.382 2.763 3.05.443a1 1 0 0 1 .554 1.705l-2.205 2.149.52 3.035a1 1 0 0 1-1.451 1.054L12 13.347l-2.744 1.444a1 1 0 0 1-1.45-1.054l.52-3.035-2.206-2.149a1 1 0 0 1 .554-1.705l3.05-.443 1.382-2.763A1 1 0 0 1 12 3Z"
        />
      </svg>
      <div>
        <p class="text-base font-semibold text-slate-800">CSV-Umsätze hochladen</p>
        <p class="text-sm text-slate-500">Ziehe die Datei hierher oder nutze den Button.</p>
      </div>
      <label class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-medium cursor-pointer hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500">
        <span>Datei auswählen</span>
        <input type="file" class="sr-only" accept=".csv,text/csv" @change="onFileInput" />
      </label>
      <p v-if="fileMeta" class="text-sm text-slate-600">
        {{ fileMeta.name }} – {{ fileMeta.size }}
      </p>
      <div v-if="previewLines.length" class="w-full mt-4">
        <p class="text-xs uppercase tracking-wide text-slate-400 text-left mb-2">Vorschau (ersten 10 Zeilen)</p>
        <pre class="bg-slate-900 text-slate-100 text-xs rounded-xl p-4 overflow-auto max-h-60 text-left whitespace-pre-wrap">
{{ previewLines.join('\n') }}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'csv-loaded', payload: { csv: string; name: string; sizeLabel: string }): void;
}>();

const isDragging = ref(false);
const fileMeta = ref<{ name: string; size: string } | null>(null);
const previewLines = ref<string[]>([]);

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const resetDragState = () => {
  isDragging.value = false;
};

const handleFile = async (file: File) => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).slice(0, 10);
  previewLines.value = lines;
  fileMeta.value = { name: file.name, size: formatBytes(file.size) };
  emit('csv-loaded', { csv: text, name: file.name, sizeLabel: formatBytes(file.size) });
};

const onDrag = () => {
  isDragging.value = true;
};

const onDragLeave = () => {
  resetDragState();
};

const onDrop = async (event: DragEvent) => {
  resetDragState();
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    await handleFile(file);
  }
};

const onFileInput = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await handleFile(file);
    target.value = '';
  }
};
</script>

<style scoped>
pre {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  border-radius: 1rem;
}
</style>
