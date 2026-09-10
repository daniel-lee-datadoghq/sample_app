import { datadogRum } from '@datadog/browser-rum';

// ----------------------------------------------------------------
// Datadog RUM initialization via npm — matches the host Angular app
// config so that sessions are stitched across the iframe boundary.
// ----------------------------------------------------------------
try {
  datadogRum.init({
    applicationId: '7c2a1106-78db-4481-a28f-b66f752cdfc3',
    clientToken: 'pub17dcc826a24006a9628a2c6c082e3709',
    site: 'datadoghq.com',
    service: 'sample-app-embedded',
    env: 'development',
    version: '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    allowedTracingUrls: [
      { match: 'http://localhost:8080/api', propagatorTypes: ['tracecontext', 'datadog'] },
    ],
    traceSampleRate: 100,
    trackSessionAcrossSubdomains: true,
    defaultPrivacyLevel: 'mask-user-input',
  });

  document.getElementById('rumStatusText').textContent =
    'Datadog RUM active (npm) — session cookies shared across subdomains';
} catch (e) {
  document.getElementById('rumStatus').classList.add('error');
  document.getElementById('rumStatusText').textContent =
    'RUM initialization failed: ' + e.message;
}

// ----------------------------------------------------------------
// Auth — read JWT token from URL query param (passed by parent app)
// ----------------------------------------------------------------
const urlParams = new URLSearchParams(window.location.search);
const authToken = urlParams.get('token');

function authHeaders() {
  return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
}

// ----------------------------------------------------------------
// State
// ----------------------------------------------------------------
let allAccounts = [];
let currentFilter = 'all';
let currentSort = 'name';
const logMessages = [];

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ----------------------------------------------------------------
// Logging helper
// ----------------------------------------------------------------
function addLog(message) {
  const now = new Date();
  const ts = now.toLocaleTimeString('en-US', { hour12: false });
  logMessages.unshift({ ts, message });
  if (logMessages.length > 50) logMessages.pop();
  renderLog();
}

function renderLog() {
  const container = document.getElementById('logEntries');
  if (logMessages.length === 0) {
    container.innerHTML = '<div class="empty-log">No interactions recorded yet.</div>';
    return;
  }
  container.innerHTML = logMessages
    .map(
      (m) =>
        `<div class="entry"><span class="timestamp">${escapeHtml(m.ts)}</span>${escapeHtml(m.message)}</div>`
    )
    .join('');
}

// ----------------------------------------------------------------
// Data fetching
// ----------------------------------------------------------------
async function fetchAccounts() {
  try {
    document.getElementById('accountsContainer').innerHTML =
      '<div class="loading">Loading accounts...</div>';
    addLog('Fetching accounts from API...');

    const response = await fetch('http://localhost:8080/api/accounts', {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    allAccounts = await response.json();
    addLog(`Loaded ${allAccounts.length} accounts`);

    populateTypeFilter();
    renderAccounts();
  } catch (err) {
    document.getElementById('accountsContainer').innerHTML =
      `<div class="error-msg">Failed to load accounts: ${err.message}. Make sure the backend is running on port 8080.</div>`;
    addLog('Error: ' + err.message);
  }
}

function populateTypeFilter() {
  const types = [...new Set(allAccounts.map((a) => a.type || 'Unknown'))];
  const select = document.getElementById('typeFilter');
  select.innerHTML = '<option value="all">All Types</option>';
  types.sort().forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    select.appendChild(opt);
  });
}

// ----------------------------------------------------------------
// Rendering
// ----------------------------------------------------------------
function getFilteredSorted() {
  let list = [...allAccounts];

  if (currentFilter !== 'all') {
    list = list.filter((a) => a.type === currentFilter);
  }

  switch (currentSort) {
    case 'name':
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'balance-desc':
      list.sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
      break;
    case 'balance-asc':
      list.sort((a, b) => (a.balance ?? 0) - (b.balance ?? 0));
      break;
    case 'type':
      list.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      break;
  }

  return list;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0);
}

function renderAccounts() {
  const list = getFilteredSorted();
  const container = document.getElementById('accountsContainer');

  if (list.length === 0) {
    container.innerHTML =
      '<div class="loading">No accounts match the current filter.</div>';
    return;
  }

  const totalBalance = list.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const avgBalance = totalBalance / list.length;

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Account Name</th>
          <th>Type</th>
          <th>Balance</th>
          <th>Account #</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map(
            (a) => `
          <tr onclick="viewAccountDetail('${a.id}', '${escapeHtml(a.name || '')}')">
            <td>${escapeHtml(a.name || 'N/A')}</td>
            <td><span class="type-chip">${escapeHtml(a.type || 'N/A')}</span></td>
            <td class="amount ${(a.balance ?? 0) >= 0 ? 'positive' : ''}">${formatCurrency(a.balance)}</td>
            <td>${escapeHtml(a.accountNumber || 'N/A')}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <div class="summary">
      <div class="summary-card">
        <div class="label">Total Accounts</div>
        <div class="value">${list.length}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Balance</div>
        <div class="value">${formatCurrency(totalBalance)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Average Balance</div>
        <div class="value">${formatCurrency(avgBalance)}</div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------
// Interaction handlers (generate RUM user actions)
// ----------------------------------------------------------------
window.applyFilter = function () {
  const select = document.getElementById('typeFilter');
  currentFilter = select.value;
  addLog(`Filter changed to: ${currentFilter}`);
  datadogRum.addAction('filter_accounts', { filterType: currentFilter });
  renderAccounts();
};

window.applySort = function () {
  const select = document.getElementById('sortBy');
  currentSort = select.value;
  addLog(`Sort changed to: ${currentSort}`);
  datadogRum.addAction('sort_accounts', { sortBy: currentSort });
  renderAccounts();
};

window.resetFilters = function () {
  currentFilter = 'all';
  currentSort = 'name';
  document.getElementById('typeFilter').value = 'all';
  document.getElementById('sortBy').value = 'name';
  addLog('Filters reset to defaults');
  datadogRum.addAction('reset_filters');
  renderAccounts();
};

window.viewAccountDetail = function (id, name) {
  addLog(`Viewed account: ${name} (${id})`);
  datadogRum.addAction('view_account_detail', { accountId: id, accountName: name });
};

window.sendCustomAction = function () {
  const timestamp = new Date().toISOString();
  addLog('Sent custom RUM action: cross_origin_test');
  datadogRum.addAction('cross_origin_test', {
    source: 'embedded-app',
    timestamp: timestamp,
    iframe: true,
  });
};

// ----------------------------------------------------------------
// Boot
// ----------------------------------------------------------------
fetchAccounts();
