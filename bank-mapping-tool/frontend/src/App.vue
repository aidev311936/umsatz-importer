<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white/80 backdrop-blur border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
            AI
          </div>
          <div>
            <h1 class="text-lg font-semibold text-slate-800">Bank Mapping Tool</h1>
            <p class="text-sm text-slate-500">Automatische Erkennung & Pflege von CSV-Bank-Mappings</p>
          </div>
        </div>
        <a
          href="https://render.com"
          target="_blank"
          rel="noreferrer"
          class="text-sm text-primary-600 hover:text-primary-700"
        >
          Bereitstellung via Render.com
        </a>
      </div>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
    <Toasts />
  </div>
</template>

<script setup lang="ts">
import Toasts from './components/Toasts.vue';
</script>
