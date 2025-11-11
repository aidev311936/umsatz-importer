<template>
  <div v-if="analysis" class="space-y-4 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Erkannte Struktur</h3>
      <span
        class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
        :class="analysis.without_header ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
      >
        {{ analysis.without_header ? 'Ohne Header' : 'Mit Header' }}
      </span>
    </div>
    <div class="grid gap-3 md:grid-cols-2">
      <div>
        <dt class="text-xs uppercase text-slate-500">Spaltenanzahl</dt>
        <dd class="text-sm font-medium">{{ analysis.column_count }}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-slate-500">Datumformat</dt>
        <dd class="text-sm font-medium">{{ analysis.booking_date_parse_format || 'Nicht erkannt' }}</dd>
      </div>
      <div v-if="analysis.header_signature?.length">
        <dt class="text-xs uppercase text-slate-500">Header-Signatur</dt>
        <dd class="text-sm font-medium">
          <ul class="list-disc list-inside space-y-1">
            <li v-for="header in analysis.header_signature" :key="header">{{ header }}</li>
          </ul>
        </dd>
      </div>
      <div v-else>
        <dt class="text-xs uppercase text-slate-500">Spaltenmarker</dt>
        <dd class="text-sm font-medium">
          <ul class="list-disc list-inside space-y-1">
            <li v-for="(marker, idx) in analysis.column_markers" :key="idx">Spalte {{ idx + 1 }} – {{ marker }}</li>
          </ul>
        </dd>
      </div>
    </div>
    <div>
      <dt class="text-xs uppercase text-slate-500">Beispielzeilen</dt>
      <div class="overflow-auto border border-slate-200 rounded">
        <table class="min-w-full text-xs">
          <thead v-if="analysis.header_signature?.length" class="bg-slate-100">
            <tr>
              <th v-for="(header, idx) in analysis.header_signature" :key="idx" class="px-3 py-2 text-left font-medium">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in analysis.rows" :key="rowIndex" class="odd:bg-white even:bg-slate-50">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="px-3 py-1 border-t border-slate-200">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  analysis: { type: Object, default: null },
});
</script>
