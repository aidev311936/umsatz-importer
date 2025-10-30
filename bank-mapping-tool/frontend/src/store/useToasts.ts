import { defineStore } from 'pinia';
import { nanoid } from 'nanoid/non-secure';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  timeout?: number;
}

export const useToasts = defineStore('toasts', {
  state: () => ({
    items: [] as ToastMessage[]
  }),
  actions: {
    push(message: Omit<ToastMessage, 'id'>) {
      const item: ToastMessage = { id: nanoid(6), timeout: 5000, ...message };
      this.items.push(item);
      if (item.timeout) {
        setTimeout(() => this.dismiss(item.id), item.timeout);
      }
      return item.id;
    },
    dismiss(id: string) {
      this.items = this.items.filter((item) => item.id !== id);
    },
    success(title: string, description?: string) {
      return this.push({ type: 'success', title, description });
    },
    error(title: string, description?: string) {
      return this.push({ type: 'error', title, description, timeout: 6000 });
    },
    info(title: string, description?: string) {
      return this.push({ type: 'info', title, description });
    }
  }
});
