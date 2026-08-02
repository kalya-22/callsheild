const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const STATUS_REFRESH_INTERVAL = 30000;

const backendStatus = document.getElementById('backendStatus');
const modelStatus = document.getElementById('modelStatus');
const databaseStatus = document.getElementById('databaseStatus');
const refreshStatusButton = document.getElementById('refreshStatusButton');
const statusNote = document.getElementById('statusNote');
const audioFile = document.getElementById('audioFile');
const dropZone = document.getElementById('dropZone');
const fileName = document.getElementById('fileName');
const predictButton = document.getElementById('predictButton');
const message = document.getElementById('message');
const resultPanel = document.getElementById('resultPanel');
const loadHistoryButton = document.getElementById('loadHistoryButton');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const historyList = document.getElementById('historyList');
const themeToggleButton = document.getElementById('themeToggleButton');
const startLiveButton = document.getElementById('startLiveButton');
const stopLiveButton = document.getElementById('stopLiveButton');
const liveRisk = document.getElementById('liveRisk');
const liveMessage = document.getElementById('liveMessage');
const liveMeterFill = document.getElementById('liveMeterFill');
const liveProbability = document.getElementById('liveProbability');
const liveTimeline = document.getElementById('liveTimeline');

const LIVE_CHUNK_SECONDS = 3;
let liveAudioContext = null;
let liveStream = null;
let liveSource = null;
let liveProcessor = null;
let liveSamples = [];
let liveChunkIndex = 0;
let liveIsSending = false;

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function riskClass(riskLevel) {
  if (riskLevel === 'high') return 'high';
  if (riskLevel === 'medium') return 'medium';
  return 'low';
}

function riskClassFromProbability(probability) {
  if (probability >= 0.75) return 'high';
  if (probability >= 0.5) return 'medium';
  return 'low';
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? 'var(--danger)' : 'var(--muted)';
}

function setPipelineState(state) {
  document.querySelectorAll('.pipeline-step').forEach((step) => {
    step.classList.remove('active', 'done');
  });

  const upload = document.querySelector('[data-step="upload"]');
  const analyze = document.querySelector('[data-step="analyze"]');
  const result = document.querySelector('[data-step="result"]');

  if (state === 'selected') {
    upload.classList.add('done');
  }

  if (state === 'analyzing') {
    upload.classList.add('done');
    analyze.classList.add('active');
  }

  if (state === 'done') {
    upload.classList.add('done');
    analyze.classList.add('done');
    result.classList.add('done');
  }
}

function setStatusChip(el, text, status) {
  el.textContent = text;
  el.classList.remove('ready', 'missing', 'offline', 'unknown');
  el.classList.add(status);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('callshieldTheme', theme);
  themeToggleButton.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('callshieldTheme');
  const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(savedTheme || defaultTheme);
}

function updateSelectedFile(fileList) {
  const dataTransfer = new DataTransfer();
  Array.from(fileList).forEach((file) => dataTransfer.items.add(file));
  audioFile.files = dataTransfer.files;
  fileName.textContent = audioFile.files[0]?.name || 'Choose or drop an audio file';
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return { detail: 'Unable to parse response from server.' };
  }
}

async function loadStatus() {
  backendStatus.textContent = 'Checking...';
  modelStatus.textContent = 'Checking...';
  databaseStatus.textContent = 'Checking...';
  setMessage('Refreshing service status...');

  try {
      const response = await fetch(`${API_BASE_URL}/status`);
    const payload = response.ok ? await response.json() : await parseJson(response);

    if (!response.ok) {
      throw new Error(payload.detail || 'Status check failed');
    }

    const backendStatusText = payload.status?.replace(/^./, (char) => char.toUpperCase()) || 'Unknown';
    const backendState = payload.status === 'ready' ? 'ready' : 'unknown';

    setStatusChip(backendStatus, backendStatusText, backendState);
    setStatusChip(modelStatus, payload.model_ready ? 'Ready' : 'Missing', payload.model_ready ? 'ready' : 'missing');
    setStatusChip(databaseStatus, payload.database_ready ? 'Ready' : 'Missing', payload.database_ready ? 'ready' : 'missing');
    statusNote.textContent = `Last refreshed at ${formatTime(new Date())}.`;
    setMessage(payload.status === 'ready' ? 'Service status is up to date.' : 'Service is reachable but degraded.');
  } catch (error) {
    setStatusChip(backendStatus, 'Offline', 'offline');
    setStatusChip(modelStatus, 'Unknown', 'unknown');
    setStatusChip(databaseStatus, 'Unknown', 'unknown');
    statusNote.textContent = `Unable to refresh status at ${formatTime(new Date())}.`;
    setMessage('Backend is offline. Start FastAPI with python scripts\\run_api.py.', true);
  }
}

function renderResult(result) {
  const risk = riskClass(result.risk_level);
  const chunks = result.chunk_predictions || [];

  resultPanel.innerHTML = `
    <div class="risk-card ${risk}">
      <div class="risk-header">
        <div>
          <h2>${result.warning ? 'Suspicious voice detected' : 'Voice appears safe'}</h2>
          <p>${result.filename}</p>
        </div>
        <span class="badge ${risk}">${result.risk_level.toUpperCase()} RISK</span>
      </div>

      <div>
        <div class="probability">${formatPercent(result.ai_probability)}</div>
        <p>AI-generated voice probability</p>
        <div class="meter">
          <div class="meter-fill ${risk}" style="width: ${Math.round(result.ai_probability * 100)}%"></div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail">
          <span>Prediction</span>
          <strong>${result.predicted_label}</strong>
        </div>
        <div class="detail">
          <span>Warning</span>
          <strong>${result.warning ? 'True' : 'False'}</strong>
        </div>
        <div class="detail">
          <span>Saved ID</span>
          <strong>${result.prediction_id ?? 'Not saved'}</strong>
        </div>
      </div>

      <div>
        <h2>Chunk-wise analysis</h2>
        <div class="chunks">
          ${chunks.map((chunk) => `
            <div class="chunk-row">
              <div class="chunk-top">
                <strong>${chunk.chunk_id}</strong>
                <span>${formatPercent(chunk.ai_probability)}</span>
              </div>
              <div class="meter">
                <div class="meter-fill ${riskClassFromProbability(chunk.ai_probability)}" style="width: ${Math.round(chunk.ai_probability * 100)}%"></div>
              </div>
              <p>${chunk.start_time_seconds}s - ${chunk.end_time_seconds}s | ${chunk.predicted_label}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function predictAudio() {
  const file = audioFile.files[0];
  if (!file) {
    setMessage('Select an audio file first.', true);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  predictButton.disabled = true;
  setPipelineState('analyzing');
  setMessage('Analyzing audio. First run can take some time...');

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    const payload = await parseJson(response);
    if (!response.ok) {
      throw new Error(payload.detail || 'Prediction failed');
    }

    renderResult(payload);
    setPipelineState('done');
    setMessage('Prediction completed and saved to history.');
    await loadHistory();
    await loadStatus();
  } catch (error) {
    setPipelineState('selected');
    setMessage(error.message, true);
  } finally {
    predictButton.disabled = false;
  }
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/history?limit=10`);
    if (!response.ok) throw new Error('Could not load history');
    const history = await response.json();

    if (history.length === 0) {
      historyList.innerHTML = '<p>No saved predictions yet.</p>';
      return;
    }

    historyList.innerHTML = history.map((item) => `
      <div class="history-item" data-id="${item.prediction_id}" aria-label="Prediction ${item.prediction_id}">
        <div class="history-top">
          <strong>#${item.prediction_id} ${item.filename}</strong>
          <span class="badge ${riskClass(item.risk_level)}">${item.risk_level}</span>
        </div>
        <p>${item.predicted_label} | ${formatPercent(item.ai_probability)} AI | Warning: ${item.warning ? 'Yes' : 'No'}</p>
      </div>
    `).join('');
  } catch (error) {
    historyList.innerHTML = `<p>${error.message}</p>`;
  }
}

async function loadHistoryDetail(predictionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${predictionId}`);
    if (!response.ok) throw new Error('Could not load prediction detail');
    const detail = await response.json();
    renderResult(detail);
    setPipelineState('done');
    setMessage(`Loaded saved prediction #${predictionId}.`);
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function clearHistory() {
  if (!confirm('Clear all prediction history?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/history`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Could not clear history');
    await loadHistory();
    await loadStatus();
    setMessage('Prediction history cleared.');
  } catch (error) {
    setMessage(error.message, true);
  }
}

function floatTo16BitPcm(floatSamples) {
  const buffer = new ArrayBuffer(floatSamples.length * 2);
  const view = new DataView(buffer);

  for (let index = 0; index < floatSamples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, floatSamples[index]));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

function writeString(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWav(floatSamples, sampleRate) {
  const pcm = floatTo16BitPcm(floatSamples);
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcm.length, true);
  new Uint8Array(buffer, 44).set(pcm);

  return new Blob([buffer], { type: 'audio/wav' });
}

function renderLiveChunk(result) {
  const risk = riskClass(result.risk_level);
  liveRisk.textContent = result.risk_level.toUpperCase();
  liveMessage.textContent = result.warning
    ? 'Warning: suspicious voice pattern detected.'
    : 'No warning for current chunk.';
  liveMeterFill.className = `meter-fill ${risk}`;
  liveMeterFill.style.width = `${Math.round(result.ai_probability * 100)}%`;
  liveProbability.textContent = `${formatPercent(result.ai_probability)} AI probability`;

  const item = document.createElement('div');
  item.className = 'live-item';
  item.innerHTML = `
    <div class="live-item-top">
      <strong>Chunk ${liveChunkIndex}</strong>
      <span class="badge ${risk}">${result.risk_level}</span>
    </div>
    <div class="meter">
      <div class="meter-fill ${risk}" style="width: ${Math.round(result.ai_probability * 100)}%"></div>
    </div>
    <p>${result.predicted_label} | ${formatPercent(result.ai_probability)} AI | Warning: ${result.warning}</p>
  `;
  liveTimeline.prepend(item);
}

async function sendLiveChunk(samples, sampleRate) {
  if (liveIsSending) return;
  liveIsSending = true;
  liveChunkIndex += 1;

  const wavBlob = encodeWav(samples, sampleRate);
  const formData = new FormData();
  formData.append('file', wavBlob, `live_chunk_${String(liveChunkIndex).padStart(4, '0')}.wav`);

  try {
    const response = await fetch(`${API_BASE_URL}/predict-chunk`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || 'Live chunk prediction failed');
    renderLiveChunk(payload);
  } catch (error) {
    liveMessage.textContent = error.message;
  } finally {
    liveIsSending = false;
  }
}

async function startLiveMonitoring() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    liveMessage.textContent = 'Microphone access is not supported in this browser.';
    return;
  }

  liveStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  liveAudioContext = new AudioContext();
  liveSource = liveAudioContext.createMediaStreamSource(liveStream);
  liveProcessor = liveAudioContext.createScriptProcessor(4096, 1, 1);
  liveSamples = [];
  liveChunkIndex = 0;
  liveTimeline.innerHTML = '';

  liveProcessor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    liveSamples.push(...input);

    const targetLength = liveAudioContext.sampleRate * LIVE_CHUNK_SECONDS;
    if (liveSamples.length >= targetLength) {
      const chunk = liveSamples.slice(0, targetLength);
      liveSamples = liveSamples.slice(targetLength);
      sendLiveChunk(chunk, liveAudioContext.sampleRate);
    }
  };

  liveSource.connect(liveProcessor);
  liveProcessor.connect(liveAudioContext.destination);

  startLiveButton.disabled = true;
  stopLiveButton.disabled = false;
  liveRisk.textContent = 'Listening';
  liveMessage.textContent = 'Microphone active. Speak or play call audio near the microphone.';
}

function stopLiveMonitoring() {
  if (liveProcessor) liveProcessor.disconnect();
  if (liveSource) liveSource.disconnect();
  if (liveStream) {
    liveStream.getTracks().forEach((track) => track.stop());
  }
  if (liveAudioContext) liveAudioContext.close();

  liveProcessor = null;
  liveSource = null;
  liveStream = null;
  liveAudioContext = null;
  liveSamples = [];

  startLiveButton.disabled = false;
  stopLiveButton.disabled = true;
  liveMessage.textContent = 'Live monitoring stopped.';
}

audioFile.addEventListener('change', () => {
  fileName.textContent = audioFile.files[0]?.name || 'Choose or drop an audio file';
  if (audioFile.files[0]) {
    setPipelineState('selected');
    setMessage('Audio selected. Click Run detection.');
  }
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('drag-over');

  if (!event.dataTransfer.files.length) return;
  updateSelectedFile(event.dataTransfer.files);
  setPipelineState('selected');
  setMessage('Audio selected. Click Run detection.');
});

historyList.addEventListener('click', (event) => {
  const item = event.target.closest('.history-item');
  if (!item) return;
  loadHistoryDetail(item.dataset.id);
});

themeToggleButton.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
});

predictButton.addEventListener('click', predictAudio);
refreshStatusButton.addEventListener('click', loadStatus);
loadHistoryButton.addEventListener('click', loadHistory);
clearHistoryButton.addEventListener('click', clearHistory);
startLiveButton.addEventListener('click', () => {
  startLiveMonitoring().catch((error) => {
    liveMessage.textContent = error.message;
    startLiveButton.disabled = false;
    stopLiveButton.disabled = true;
  });
});
stopLiveButton.addEventListener('click', stopLiveMonitoring);

initializeTheme();
loadStatus();
loadHistory();
setInterval(loadStatus, STATUS_REFRESH_INTERVAL);
