export type ImportStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ImportJob {
  id: string;
  status: ImportStatus;
  startedAt: string;
  finishedAt: string | null;
  message?: string | null;
}

export interface ImportSummary {
  total: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
}

export interface ImportResponse {
  summary: ImportSummary;
  jobs: ImportJob[];
  lastUpdated?: string;
}

declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

export {};
