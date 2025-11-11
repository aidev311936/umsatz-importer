import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '/api';

const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('supportToken');
  if (token) {
    config.headers['x-support-token'] = token;
  }
  return config;
});

export const fetchBankMappings = async (search = '') => {
  const response = await apiClient.get('bank-mappings', { params: { search } });
  return response.data.data;
};

export const fetchBankMapping = async (id) => {
  const response = await apiClient.get(`bank-mappings/${id}`);
  return response.data.data;
};

export const createBankMapping = async (payload) => {
  const response = await apiClient.post('bank-mappings', payload);
  return response.data.data;
};

export const updateBankMapping = async (id, payload) => {
  const response = await apiClient.put(`bank-mappings/${id}`, payload);
  return response.data.data;
};

export const analyzeCsv = async ({ file, delimiter }) => {
  const formData = new FormData();
  formData.append('file', file);
  if (delimiter) formData.append('delimiter', delimiter);
  const response = await apiClient.post('bank-mappings/analyze', formData);
  return response.data.data;
};

export const requestAiSuggestion = async ({ file, csvSample, delimiter, additionalContext }) => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  } else if (csvSample) {
    formData.append('csvSample', csvSample);
  }
  if (delimiter) formData.append('delimiter', delimiter);
  if (additionalContext) {
    formData.append('additionalContext', JSON.stringify(additionalContext));
  }
  const response = await apiClient.post('bank-mappings/suggest', formData);
  return response.data;
};

export default apiClient;
