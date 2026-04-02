import { state, emit } from './state.js';
import { storage } from './services/storage.js';
import { personaService } from './services/persona.js';
import { conversationService } from './services/conversation.js';
import { chatService } from './services/chat.js';
import { listVoices } from './services/fishAudio.js';
import { sidebar } from './ui/components/sidebar.js';
import { chatHeader } from './ui/components/chatHeader.js';
import { messageList } from './ui/components/messageList.js';
import { chatInput } from './ui/components/chatInput.js';
import { personaForm } from './ui/components/personaForm.js';
import { settingsPanel } from './ui/components/settingsPanel.js';
import { router } from './ui/router.js';
import { initRender } from './ui/render.js';

const MODELS = [
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-haiku-4-5',
  'deepseek/deepseek-chat',
];

function toast(text) {
  const root = document.getElementById('toast-root');
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = text;
  root.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function setView(view) {
  state.view = view;
  emit('view:changed', view);
}

function persistSettings() {
  storage.set('settings', state.settings);
}

async function maybeInitiative(personaId) {
  const convo = conversationService.get(personaId);
  if (!convo.messages.length) {
    await chatService.triggerInitiative({
      personaId,
      reason: 'first_open',
    });
    return;
  }

  const last = convo.messages[convo.messages.length - 1];
  const away = Date.now() - convo.lastMessageAt;
  if (away > 6 * 60 * 60 * 1000 && last?.role === 'user') {
    await chatService.triggerInitiative({
      personaId,
      reason: 'time_away',
      hoursAway: Math.round(away / (60 * 60 * 1000)),
    });
  }
}

async function openChat(personaId) {
  state.activePersonaId = personaId;
  conversationService.markAsRead(personaId);

  try {
    await maybeInitiative(personaId);
  } catch (err) {
    toast(String(err.message || err));
  }

  setView('chat');
  emit('conversation:updated', { personaId });
}

async function openPersonaForm(personaId = null) {
  state.editingPersonaId = personaId;
  setView('persona-form');

  if (state.settings.keys.fishAudio) {
    try {
      state.voiceOptions = await listVoices();
      emit('voice:changed', state.voiceOptions);
    } catch {
      state.voiceOptions = [];
      emit('voice:changed', state.voiceOptions);
    }
  }
}

function openSettings() {
  setView('settings');
}

function savePersona(formData) {
  try {
    if (state.editingPersonaId) {
      personaService.update(state.editingPersonaId, formData);
    } else {
      const created = personaService.create(formData);
      state.activePersonaId = created.id;
      conversationService.get(created.id);
    }
    state.editingPersonaId = null;
    setView(state.activePersonaId ? 'chat' : 'sidebar');
  } catch (err) {
    toast(String(err.message || err));
  }
}

function deletePersona(personaId) {
  personaService.delete(personaId);
  delete state.conversations[personaId];
  conversationService.persist();
  if (state.activePersonaId === personaId) state.activePersonaId = null;
  state.editingPersonaId = null;
  setView('sidebar');
  emit('conversation:updated', {});
}

async function sendMessage(text, image) {
  if (!state.activePersonaId) return;
  try {
    await chatService.sendMessage({
      personaId: state.activePersonaId,
      content: text,
      imageBase64: image?.base64,
      imageMimeType: image?.mimeType,
    });
  } catch (err) {
    toast(String(err.message || err));
  }
}

function setActiveModel() {
  if (!state.activePersonaId) return;
  const convo = conversationService.get(state.activePersonaId);
  const idx = MODELS.indexOf(convo.activeModel);
  convo.activeModel = MODELS[(idx + 1 + MODELS.length) % MODELS.length];
  conversationService.persist();
  emit('conversation:updated', { personaId: state.activePersonaId });
}

function clearChat(personaId) {
  if (!personaId) return;
  conversationService.clearHistory(personaId);
}

function saveSettings(settingsData) {
  state.settings = {
    ...state.settings,
    ...settingsData,
    keys: {
      ...(state.settings.keys || {}),
      ...(settingsData.keys || {}),
    },
  };
  persistSettings();
  emit('settings:changed', state.settings);
  setView(state.activePersonaId ? 'chat' : 'sidebar');
}

function closeOverlay() {
  if (state.view === 'settings' || state.view === 'persona-form') {
    setView(state.activePersonaId ? 'chat' : 'sidebar');
  }
}

function init() {
  state.settings = {
    keys: {},
    proxyEnabled: false,
    proxyUrl: '',
    ...(storage.get('settings') || {}),
  };

  personaService.loadFromStorage();
  conversationService.loadFromStorage();
  state.personas.forEach((p) => conversationService.get(p.id));

  sidebar.init({
    onOpenChat: openChat,
    onOpenPersonaForm: openPersonaForm,
    onDeletePersona: deletePersona,
    onOpenSettings: openSettings,
  });

  chatHeader.init({
    onBack: () => setView('sidebar'),
    onCycleModel: setActiveModel,
    onClearChat: () => clearChat(state.activePersonaId),
  });

  chatInput.init({ onSend: sendMessage });

  personaForm.init({
    onSave: savePersona,
    onDelete: deletePersona,
    onClose: closeOverlay,
  });

  settingsPanel.init({
    onSave: saveSettings,
    onClose: closeOverlay,
  });

  initRender();

  if (state.personas.length) {
    state.activePersonaId = state.personas[0].id;
    setView('chat');
    emit('conversation:updated', { personaId: state.activePersonaId });
  } else {
    setView('sidebar');
  }

  sidebar.render();
  messageList.render();
  chatHeader.render();
  router.navigate(state.view);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay();
  });
}

init();
