<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
    <div class="w-full max-w-md bg-white shadow-md rounded-lg p-8 space-y-6">
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-semibold">Support Login</h1>
        <p class="text-slate-600 text-sm">
          Geben Sie Ihr Support-Token ein, um die Bank-Mappings zu verwalten.
        </p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700">Support-Token</label>
          <input v-model="token" type="password" required class="mt-1 w-full" />
        </div>
        <button class="primary w-full" type="submit" :disabled="loading">
          <span v-if="loading">Anmelden…</span>
          <span v-else>Anmelden</span>
        </button>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const token = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    if (!token.value) {
      throw new Error('Bitte geben Sie ein Token ein.');
    }
    localStorage.setItem('supportToken', token.value);
    await router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = err.message || 'Anmeldung fehlgeschlagen';
  } finally {
    loading.value = false;
  }
};
</script>
