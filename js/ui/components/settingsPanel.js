import { state } from '../../state.js';
import { VISION_MODELS, DEFAULT_VISION_MODEL } from '../../services/gemini.js';

let handlers = {
  onSave: () => {},
  onClose: () => {},
};

const root = document.getElementById('settings-panel');

const keyRows = [
  ['anthropic', 'Anthropic'],
  ['deepseek', 'Deepseek'],
  ['gemini', 'Gemini'],
  ['fishAudio', 'Fish Audio'],
  ['braveSearch', 'Brave Search'],
];

export const settingsPanel = {
  init(h) {
    handlers = { ...handlers, ...h };
  },

  render() {
    if (state.view !== 'settings') {
      root.innerHTML = '';
      return;
    }

    const rows = keyRows.map(([id, label]) => `
      <div class="field">
        <label>${label}</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="password" name="key_${id}" value="${state.settings.keys[id] || ''}" placeholder="${label} API key">
          <span>${state.settings.keys[id] ? '✓' : ''}</span>
        </div>
      </div>
    `).join('');

    const selectedVisionModel = state.settings.visionModel || DEFAULT_VISION_MODEL;
    const visionOptions = VISION_MODELS.map((m) => `<option value="${m.id}" ${selectedVisionModel === m.id ? 'selected' : ''}>${m.label}</option>`).join('');

    root.innerHTML = `
      <div class="card settings-wrap">
        <h2>Settings</h2>
        <form id="settings-form" class="form-grid">
          ${rows}

          <div class="field" style="grid-column:1/-1;">
            <label>Vision Model (for image descriptions)</label>
            <select name="visionModel">
              ${visionOptions}
            </select>
            <small>Used when you send an image. Stable models are more reliable; preview models may hit quota limits.</small>
          </div>

          <div class="field" style="grid-column:1/-1;border-top:1px solid #dbcdb7;padding-top:12px;">
            <h3>CORS</h3>
            <label><input type="checkbox" name="proxyEnabled" ${state.settings.proxyEnabled ? 'checked' : ''}> Enable CORS Proxy</label>
            <input type="text" name="proxyUrl" placeholder="https://cors-anywhere.herokuapp.com/" value="${state.settings.proxyUrl || ''}">
            <small>Enable if you get CORS errors. The Anthropic direct-browser header is removed automatically when a proxy is active.</small>
          </div>

          <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;">
            <button type="button" class="btn" id="cancel-settings">Close</button>
            <button type="submit" class="btn primary">Save</button>
          </div>
        </form>
      </div>
    `;

    root.querySelector('#cancel-settings')?.addEventListener('click', handlers.onClose);
    root.querySelector('#settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const keys = {};
      keyRows.forEach(([id]) => { keys[id] = String(fd.get(`key_${id}`) || '').trim(); });
      handlers.onSave({
        keys,
        proxyEnabled: fd.get('proxyEnabled') === 'on',
        proxyUrl: String(fd.get('proxyUrl') || '').trim(),
        visionModel: String(fd.get('visionModel') || DEFAULT_VISION_MODEL),
      });
    });
  },
};
