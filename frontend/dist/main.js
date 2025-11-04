const API_PATH = '/imports';
function resolveApiEndpoint() {
    var _a;
    const base = (_a = window.__API_BASE__) === null || _a === void 0 ? void 0 : _a.trim();
    if (!base) {
        return `/api${API_PATH}`;
    }
    const normalizedBase = base.replace(/\/+$/, '');
    return `${normalizedBase}${API_PATH}`;
}
const API_ENDPOINT = resolveApiEndpoint();
const summaryTotal = document.getElementById('summary-total');
const summaryCompleted = document.getElementById('summary-completed');
const summaryRunning = document.getElementById('summary-running');
const summaryPending = document.getElementById('summary-pending');
const summaryFailed = document.getElementById('summary-failed');
const jobsContainer = document.getElementById('jobs-container');
const emptyState = document.getElementById('empty-state');
const errorMessage = document.getElementById('error-message');
const lastUpdated = document.getElementById('last-updated');
const refreshButton = document.getElementById('refresh-button');
function formatDate(value) {
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
function badgeClass(status) {
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
function renderJob(job) {
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
function renderSummary(data) {
    if (summaryTotal)
        summaryTotal.textContent = data.summary.total.toString();
    if (summaryCompleted)
        summaryCompleted.textContent = data.summary.completed.toString();
    if (summaryRunning)
        summaryRunning.textContent = data.summary.running.toString();
    if (summaryPending)
        summaryPending.textContent = data.summary.pending.toString();
    if (summaryFailed)
        summaryFailed.textContent = data.summary.failed.toString();
}
function renderJobs(data) {
    if (!jobsContainer) {
        return;
    }
    jobsContainer.innerHTML = '';
    if (!data.jobs.length) {
        jobsContainer.setAttribute('hidden', '');
        emptyState === null || emptyState === void 0 ? void 0 : emptyState.removeAttribute('hidden');
        return;
    }
    jobsContainer.removeAttribute('hidden');
    emptyState === null || emptyState === void 0 ? void 0 : emptyState.setAttribute('hidden', '');
    const fragment = document.createDocumentFragment();
    data.jobs.forEach((job) => fragment.appendChild(renderJob(job)));
    jobsContainer.appendChild(fragment);
}
function updateTimestamp(timestamp) {
    if (!lastUpdated)
        return;
    const value = timestamp ? new Date(timestamp) : new Date();
    const formatted = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(value);
    lastUpdated.textContent = `Last updated: ${formatted}`;
}
async function fetchImports() {
    if (!refreshButton) {
        return;
    }
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing…';
    errorMessage === null || errorMessage === void 0 ? void 0 : errorMessage.setAttribute('hidden', '');
    try {
        const response = await fetch(API_ENDPOINT, {
            headers: {
                Accept: 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json());
        renderSummary(payload);
        renderJobs(payload);
        updateTimestamp(payload.lastUpdated);
    }
    catch (error) {
        if (errorMessage) {
            errorMessage.textContent =
                error instanceof Error ? error.message : 'Unknown error occurred';
            errorMessage.removeAttribute('hidden');
        }
    }
    finally {
        refreshButton.disabled = false;
        refreshButton.textContent = 'Refresh';
    }
}
refreshButton === null || refreshButton === void 0 ? void 0 : refreshButton.addEventListener('click', () => {
    void fetchImports();
});
void fetchImports();
export {};
