import { defineStore } from 'pinia';
import client from '../api/client';
import type { BankMapping, BankMappingUpsertInput } from '~shared/mappingSchema';

export interface DetectionPayload {
  booking_date: string[];
  amount: string[];
  booking_text: string[];
  booking_type: string[];
  booking_date_parse_format: string;
  without_header: boolean;
  detection_hints: Record<string, unknown>;
}

export interface DetectionState {
  mapping: DetectionPayload | null;
  bankGuess?: {
    label: string;
    confidence?: number;
  };
}

export const useMappingsStore = defineStore('mappings', {
  state: () => ({
    items: [] as BankMapping[],
    loading: false,
    detectionLoading: false,
    detection: null as DetectionState | null
  }),
  actions: {
    async loadMappings() {
      this.loading = true;
      try {
        const { data } = await client.get<BankMapping[]>('/api/mappings');
        this.items = data;
      } finally {
        this.loading = false;
      }
    },
    async detectFromCsv(payload: { csv: string; sampleLimit?: number; userBankGuess?: string }) {
      this.detectionLoading = true;
      try {
        const { data } = await client.post<DetectionPayload>('/api/ai/detect', payload);
        const hints = data.detection_hints as Record<string, unknown>;
        let bankGuess: DetectionState['bankGuess'];
        const guess = hints?.['bank_guess'];
        if (typeof guess === 'object' && guess && 'name' in guess) {
          bankGuess = {
            label: String((guess as any).name),
            confidence: typeof (guess as any).confidence === 'number' ? (guess as any).confidence : undefined
          };
        }
        this.detection = { mapping: data, bankGuess };
        return data;
      } finally {
        this.detectionLoading = false;
      }
    },
    async saveMapping(input: BankMappingUpsertInput) {
      const { data } = await client.post<BankMapping>('/api/mappings', input);
      const existingIndex = this.items.findIndex((item) => item.bank_name === data.bank_name);
      if (existingIndex >= 0) {
        this.items.splice(existingIndex, 1, data);
      } else {
        this.items.push(data);
        this.items.sort((a, b) => a.bank_name.localeCompare(b.bank_name));
      }
      return data;
    }
  }
});
