import type { ImportJob, ImportResponse, ImportStatus } from './types';

const API_ENDPOINT = '/api/imports';

const summaryTotal = document.getElementById('summary-total');
const summaryCompleted = document.getElementById('summary-completed');
const summaryRunning = document.getElementById('summary-running');
const summaryPending = document.getElementById('summary-pending');
const summaryFailed = document.getElementById('summary-failed');
const jobsContainer = document.getElementById('jobs-container');
const emptyState = document.getElementById('empty-state');
const errorMessage = document.getElementById('error-message');
const lastUpdated = document.getElementById('last-updated');
const refreshButton = document.getElementById(
  'refresh-button',
) as HTMLButtonElement | null;

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function badgeClass(status: ImportStatus): string {
  switch (status) {
    case 'completed':
      return 'badge badge--completed';
    case 'failed':
      return 'badge badge--failed';
    case 'running':
      return 'badge badge--running';
    default:
      return 'badge badge--pending';
  }
}

function renderJob(job: ImportJob): HTMLElement {
  const element = document.createElement('article');
  element.className = 'job';
  element.innerHTML = `
    <div class="job-header">
      <h3 class="job-title">Job ${job.id}</h3>
      <span class="${badgeClass(job.status)}">${job.status}</span>
    </div>
    <p class="job-meta">Started: <strong>${formatDate(job.startedAt)}</strong></p>
    <p class="job-meta">Finished: <strong>${formatDate(job.finishedAt)}</strong></p>
  `;

  if (job.message) {
    const message = document.createElement('p');
    message.className = 'job-meta';
    message.textContent = job.message;
    element.appendChild(message);
  }

  return element;
}

function renderSummary(data: ImportResponse): void {
  if (summaryTotal) summaryTotal.textContent = data.summary.total.toString();
  if (summaryCompleted)
    summaryCompleted.textContent = data.summary.completed.toString();
  if (summaryRunning)
    summaryRunning.textContent = data.summary.running.toString();
  if (summaryPending)
    summaryPending.textContent = data.summary.pending.toString();
  if (summaryFailed) summaryFailed.textContent = data.summary.failed.toString();
}

function renderJobs(data: ImportResponse): void {
  if (!jobsContainer) {
    return;
  }

  jobsContainer.innerHTML = '';

  if (!data.jobs.length) {
    jobsContainer.setAttribute('hidden', '');
    emptyState?.removeAttribute('hidden');
    return;
  }

  jobsContainer.removeAttribute('hidden');
  emptyState?.setAttribute('hidden', '');

  const fragment = document.createDocumentFragment();
  data.jobs.forEach((job) => fragment.appendChild(renderJob(job)));
  jobsContainer.appendChild(fragment);
}

function updateTimestamp(timestamp?: string): void {
  if (!lastUpdated) return;

  const value = timestamp ? new Date(timestamp) : new Date();
  const formatted = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);

  lastUpdated.textContent = `Last updated: ${formatted}`;
}

async function fetchImports(): Promise<void> {
  if (!refreshButton) {
    return;
  }

  refreshButton.disabled = true;
  refreshButton.textContent = 'Refreshing…';
  errorMessage?.setAttribute('hidden', '');

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ImportResponse;
    renderSummary(payload);
    renderJobs(payload);
    updateTimestamp(payload.lastUpdated);
  } catch (error) {
    if (errorMessage) {
      errorMessage.textContent =
        error instanceof Error ? error.message : 'Unknown error occurred';
      errorMessage.removeAttribute('hidden');
    }
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = 'Refresh';
  }
}

refreshButton?.addEventListener('click', () => {
  void fetchImports();
});

void fetchImports();
