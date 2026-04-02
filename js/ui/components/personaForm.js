import { state } from '../../state.js';
import { storage } from '../../services/storage.js';

let handlers = {
  onSave: () => {},
  onDelete: () => {},
  onClose: () => {},
};

const root = document.getElementById('persona-form-panel');
const DRAFT_KEY = 'persona_form_draft';
let autosaveId = null;

const requiredFields = ['name', 'age', 'gender', 'personality', 'appearance'];

const optionalSections = [
  {
    title: 'Background',
    fields: [
      ['nationality', 'Nationality'],
      ['education', 'Education'],
      ['occupation', 'Occupation'],
      ['socioeconomicStatus', 'Socioeconomic status'],
      ['livingSituation', 'Living situation'],
      ['relationshipStatus', 'Relationship status'],
    ],
  },
  {
    title: 'Speech and behavior',
    fields: [
      ['speakingStyle', 'Speaking style'],
      ['textingHabits', 'Texting habits'],
      ['language', 'Language'],
      ['vocabularyLevel', 'Vocabulary level'],
      ['quirks', 'Quirks'],
    ],
  },
  {
    title: 'Inner world',
    fields: [
      ['interests', 'Interests'],
      ['dislikes', 'Dislikes'],
      ['values', 'Values'],
      ['fears', 'Fears'],
      ['goals', 'Goals'],
      ['flaws', 'Flaws'],
    ],
  },
  {
    title: 'Lore and history',
    fields: [
      ['backstory', 'Backstory'],
      ['keyRelationships', 'Key relationships'],
      ['definingEvents', 'Defining events'],
      ['secrets', 'Secrets'],
      ['trauma', 'Trauma'],
      ['religion', 'Religion'],
    ],
  },
  {
    title: 'Relationship to you',
    fields: [
      ['roleToUser', 'Role to user'],
      ['howTheyKnowUser', 'How they know each other'],
      ['emotionalToneToUser', 'Emotional tone toward user'],
    ],
  },
  {
    title: 'Behavior rules',
    fields: [
      ['topicsToAvoid', 'Topics to avoid'],
      ['topicsTheyLove', 'Topics they love'],
      ['extraInstructions', 'Extra instructions'],
    ],
  },
];

function getEditingPersona() {
  if (!state.editingPersonaId) return null;
  return state.personas.find((p) => p.id === state.editingPersonaId) || null;
}

function field(name, label, value = '', type = 'text', required = false) {
  return `
    <label class="field">
      <span>${label}${required ? '' : ' (optional)'}</span>
      <${type === 'textarea' ? 'textarea' : 'input'} name="${name}" ${type !== 'textarea' ? `type="${type}"` : ''} ${required ? 'required' : ''}>${type === 'textarea' ? value || '' : ''}</${type === 'textarea' ? 'textarea' : 'input'}>
    </label>
  `;
}

function bindValues(form, source) {
  Object.entries(source || {}).forEach(([key, val]) => {
    const el = form.elements.namedItem(key);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = Boolean(val);
    } else {
      el.value = String(val || '');
    }
  });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export const personaForm = {
  init(h) {
    handlers = { ...handlers, ...h };
  },

  render() {
    if (state.view !== 'persona-form') {
      root.innerHTML = '';
      if (autosaveId) clearInterval(autosaveId);
      autosaveId = null;
      return;
    }

    const editing = getEditingPersona();
    const draft = storage.get(DRAFT_KEY) || {};
    const voices = state.voiceOptions || [];

    const optionalHtml = optionalSections.map((section) => `
      <details>
        <summary>${section.title}</summary>
        <div class="form-grid">
          ${section.fields.map(([name, label]) => field(name, label, '', 'textarea', false)).join('')}
        </div>
      </details>
    `).join('');

    root.innerHTML = `
      <div class="card form-wrap">
        <h2>${editing ? 'Edit Persona' : 'Create Persona'}</h2>
        <form id="persona-form">
          <h3>Core identity</h3>
          <div class="form-grid">
            ${field('name', 'Name', '', 'text', true)}
            ${field('age', 'Age', '', 'text', true)}
            ${field('gender', 'Gender', '', 'text', true)}
            ${field('personality', 'Personality', '', 'textarea', true)}
            ${field('appearance', 'Appearance', '', 'textarea', true)}
          </div>

          ${optionalHtml}

          <h3>Config</h3>
          <div class="form-grid">
            <label class="field">
              <span>Default model</span>
              <select name="defaultModel">
                <option value="anthropic/claude-sonnet-4-5">Anthropic Sonnet</option>
                <option value="anthropic/claude-haiku-4-5">Anthropic Haiku</option>
                <option value="deepseek/deepseek-chat">Deepseek Chat</option>
              </select>
            </label>

            <label class="field">
              <span>Fish Audio voice picker (optional)</span>
              <div style="display:flex;gap:8px;">
                <select name="voiceId">
                  <option value="">None</option>
                  ${voices.map((v) => `<option value="${v.id}">${v.name}</option>`).join('')}
                </select>
                <button type="button" class="btn" id="preview-voice">Preview</button>
              </div>
            </label>

            <label class="field">
              <span>Avatar upload (optional)</span>
              <input name="avatarFile" type="file" accept="image/*">
            </label>

            <label class="field">
              <span>Initiative enabled</span>
              <input name="initiativeEnabled" type="checkbox" checked>
            </label>

            <label class="field">
              <span>Initiative frequency</span>
              <select name="initiativeFrequency">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div style="margin-top:12px;display:flex;justify-content:space-between;gap:8px;">
            <div>
              ${editing ? '<button type="button" class="btn" id="delete-persona">Delete</button>' : ''}
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn" id="cancel-persona">Cancel</button>
              <button type="submit" class="btn primary">Save Persona</button>
            </div>
          </div>
        </form>
      </div>
    `;

    const form = root.querySelector('#persona-form');
    bindValues(form, { ...draft, ...(editing || {}) });

    root.querySelector('#cancel-persona')?.addEventListener('click', handlers.onClose);
    root.querySelector('#delete-persona')?.addEventListener('click', () => {
      if (editing) handlers.onDelete(editing.id);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {};

      for (const [k, v] of fd.entries()) {
        if (k === 'avatarFile') continue;
        payload[k] = typeof v === 'string' ? v.trim() : v;
      }
      payload.initiativeEnabled = fd.get('initiativeEnabled') === 'on';

      requiredFields.forEach((name) => {
        if (!String(payload[name] || '').trim()) throw new Error(`Missing required field: ${name}`);
      });

      const avatarFile = form.elements.namedItem('avatarFile')?.files?.[0];
      if (avatarFile) {
        payload.avatarUrl = await toBase64(avatarFile);
      }

      handlers.onSave(payload);
      storage.remove(DRAFT_KEY);
    });

    root.querySelector('#preview-voice')?.addEventListener('click', () => {
      const selected = String(form.elements.namedItem('voiceId')?.value || '');
      if (!selected) return;
      const voice = voices.find((v) => v.id === selected);
      if (!voice?.previewUrl) return;
      const audio = new Audio(voice.previewUrl);
      audio.play().catch(() => {});
    });

    if (autosaveId) clearInterval(autosaveId);
    autosaveId = setInterval(() => {
      const live = new FormData(form);
      const draftData = {};
      for (const [k, v] of live.entries()) {
        if (k === 'avatarFile') continue;
        draftData[k] = v;
      }
      draftData.initiativeEnabled = live.get('initiativeEnabled') === 'on';
      storage.set(DRAFT_KEY, draftData);
    }, 2000);
  },
};
