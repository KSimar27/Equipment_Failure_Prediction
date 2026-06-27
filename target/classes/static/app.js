/* ═══════════════════════════════════════════════════════════════════════════
   CraneGuard — app.js
   Handles: file upload / drag-drop → POST /api/predict → render dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE = '';   // same origin (Spring Boot serves static files too)

/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const csvInput        = document.getElementById('csvInput');
const fileNameLabel   = document.getElementById('fileNameLabel');
const analyzeBtn      = document.getElementById('analyzeBtn');
const dropZone        = document.getElementById('dropZone');

const uploadSection   = document.getElementById('uploadSection');
const loadingSection  = document.getElementById('loadingSection');
const dashboard       = document.getElementById('dashboard');
const errorSection    = document.getElementById('errorSection');
const errorMessage    = document.getElementById('errorMessage');

const serverStatus    = document.getElementById('serverStatus');
const statusLabel     = serverStatus.querySelector('.status-label');

const resetBtn        = document.getElementById('resetBtn');
const errorResetBtn   = document.getElementById('errorResetBtn');

/* Chart instances (kept so we can destroy on re-run) */
let hourlyChartInst   = null;
let intensityChartInst = null;

/* ── Server health check ──────────────────────────────────────────────────── */
async function checkServer() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      serverStatus.className = 'server-status up';
      statusLabel.textContent = 'Server online';
    } else throw new Error();
  } catch {
    serverStatus.className = 'server-status down';
    statusLabel.textContent = 'Server offline';
  }
}
checkServer();
setInterval(checkServer, 15000);   // re-check every 15 s

/* ── File selection ───────────────────────────────────────────────────────── */
csvInput.addEventListener('change', () => {
  const file = csvInput.files[0];
  if (file) {
    fileNameLabel.textContent = `📄 ${file.name} (${formatBytes(file.size)})`;
    analyzeBtn.disabled = false;
  }
});

/* ── Drag & drop ──────────────────────────────────────────────────────────── */
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
['dragleave', 'dragend'].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'))
);
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) {
    // Assign to the file input so the same code path works
    const dt = new DataTransfer();
    dt.items.add(file);
    csvInput.files = dt.files;
    fileNameLabel.textContent = `📄 ${file.name} (${formatBytes(file.size)})`;
    analyzeBtn.disabled = false;
  } else {
    showError('Only .csv files are supported. Please drop a CSV file.');
  }
});

/* ── Analyse button ───────────────────────────────────────────────────────── */
analyzeBtn.addEventListener('click', runAnalysis);

async function runAnalysis() {
  const file = csvInput.files[0];
  if (!file) return;

  showSection('loading');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showError(data.errorMessage || `Server returned ${res.status}`);
      return;
    }

    renderDashboard(data);
    showSection('dashboard');

  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      showError('Cannot reach the server. Make sure Spring Boot is running on port 8080.');
    } else {
      showError(err.message || 'Unexpected error during analysis.');
    }
  }
}

/* ── Reset ────────────────────────────────────────────────────────────────── */
[resetBtn, errorResetBtn].forEach(btn =>
  btn.addEventListener('click', () => {
    csvInput.value = '';
    fileNameLabel.textContent = 'No file selected';
    analyzeBtn.disabled = true;
    destroyCharts();
    showSection('upload');
  })
);

/* ═══════════════════════════════════════════════════════════════════════════
   RENDER DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
function renderDashboard(d) {

  /* ── Status banner ─────────────────────────────────────────────────────── */
  const banner   = document.getElementById('statusBanner');
  const iconEl   = document.getElementById('statusIcon');
  const labelEl  = document.getElementById('statusLabel');
  const subEl    = document.getElementById('statusSublabel');
  const confBadge = document.getElementById('confidenceBadge');

  banner.className = `status-banner ${d.status}`;

  const statusMeta = {
    CRITICAL: { icon: '🔴', label: '⚠ CRITICAL — Failure Imminent',   sub: `Estimated failure in ~${Math.round(d.minutesToFailure)} minutes` },
    WARNING:  { icon: '🟡', label: '⚡ WARNING — Elevated Strain',      sub: `Estimated failure in ~${Math.round(d.minutesToFailure / 60)} hours` },
    STABLE:   { icon: '🟢', label: '✔ STABLE — Normal Operation',      sub: 'No failure predicted in current window' },
  };
  const meta = statusMeta[d.status] || statusMeta.STABLE;
  iconEl.textContent  = meta.icon;
  labelEl.textContent = meta.label;
  subEl.textContent   = meta.sub;
  confBadge.textContent = `Confidence: ${d.confidence}%`;

  /* ── KPI cards ─────────────────────────────────────────────────────────── */
  setText('kpiPredicted', d.predictedFailureTimestamp || '—');
  setText('kpiActual',    d.actualFailureTimestamp    || '—');
  setText('kpiIntensity', d.currentIntensity.toFixed(3));
  setText('kpiGrowth',    d.currentGrowth.toFixed(3));
  setText('kpiEvents',    d.totalHighStrainIntervals.toLocaleString());
  setText('kpiPeak',      d.peakStrainValue.toFixed(1));
  setText('kpiRate',      d.averageStrainRate.toFixed(4));
  setText('kpiBaseline',  d.baseline.toFixed(4));

  /* ── Charts ────────────────────────────────────────────────────────────── */
  destroyCharts();
  renderHourlyChart(d.hourlyEventSeries   || []);
  renderIntensityChart(d.intensityTimeline || []);

  /* ── Events table ──────────────────────────────────────────────────────── */
  const tbody = document.getElementById('eventsTableBody');
  tbody.innerHTML = '';
  const rows = d.rawDataPreview || [];
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No high-strain intervals found</td></tr>';
  } else {
    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      const strainClass = row.peakStrain >= 1200 ? 'strain-high'
                        : row.peakStrain >= 950  ? 'strain-med' : '';
      tr.innerHTML = `
        <td>${rows.length - i}</td>
        <td>${row.start}</td>
        <td>${row.end}</td>
        <td>${row.durationSec}</td>
        <td class="${strainClass}">${row.peakStrain}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

/* ── Hourly event count chart (time-series bar) ───────────────────────────── */
function renderHourlyChart(series) {
  const ctx = document.getElementById('hourlyChart').getContext('2d');

  const labels = series.map(p => p.time);
  const values = series.map(p => p.events);

  hourlyChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Events / hour',
        data: values,
        backgroundColor: 'rgba(240,165,0,0.55)',
        borderColor: 'rgba(240,165,0,0.9)',
        borderWidth: 1,
        borderRadius: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c2128',
          titleColor: '#e6edf3',
          bodyColor: '#8b949e',
          borderColor: '#30363d',
          borderWidth: 1,
          callbacks: {
            title: items => formatDateLabel(items[0].label),
            label: item  => ` ${item.raw} high-strain event(s)`
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd HH:mm' },
          ticks: { color: '#8b949e', maxTicksLimit: 10 },
          grid:  { color: '#21262d' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#8b949e', stepSize: 1 },
          grid:  { color: '#21262d' }
        }
      }
    }
  });
}

/* ── Intensity index over time (line) ─────────────────────────────────────── */
function renderIntensityChart(timeline) {
  const ctx = document.getElementById('intensityChart').getContext('2d');

  const labels     = timeline.map(p => p.time);
  const intensity  = timeline.map(p => p.intensity);
  const growth     = timeline.map(p => p.growth);

  intensityChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Intensity',
          data: intensity,
          borderColor: '#f0a500',
          backgroundColor: 'rgba(240,165,0,0.08)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Growth',
          data: growth,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88,166,255,0.06)',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          tension: 0.35,
          borderDash: [4, 3],
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#8b949e', font: { size: 11 }, boxWidth: 14 }
        },
        tooltip: {
          backgroundColor: '#1c2128',
          titleColor: '#e6edf3',
          bodyColor: '#8b949e',
          borderColor: '#30363d',
          borderWidth: 1,
          callbacks: { title: items => formatDateLabel(items[0].label) }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd HH:mm' },
          ticks: { color: '#8b949e', maxTicksLimit: 6 },
          grid:  { color: '#21262d' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#8b949e' },
          grid:  { color: '#21262d' }
        }
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function showSection(name) {
  uploadSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  dashboard.classList.add('hidden');
  errorSection.classList.add('hidden');

  if (name === 'upload')    uploadSection.classList.remove('hidden');
  if (name === 'loading')   loadingSection.classList.remove('hidden');
  if (name === 'dashboard') dashboard.classList.remove('hidden');
  if (name === 'error')     errorSection.classList.remove('hidden');
}

function showError(msg) {
  errorMessage.textContent = msg;
  showSection('error');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function destroyCharts() {
  if (hourlyChartInst)    { hourlyChartInst.destroy();    hourlyChartInst    = null; }
  if (intensityChartInst) { intensityChartInst.destroy(); intensityChartInst = null; }
}

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDateLabel(raw) {
  /* raw is an ISO string like "2025-11-03T14:00:00" */
  try {
    return new Date(raw).toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return raw; }
}
