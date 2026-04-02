import { state } from '../../state.js';
import { formatLastSeen } from '../../utils.js';

let handlers = {
  onBack: () => {},
  onCycleModel: () => {},
  onClearChat: () => {},
};

const root = document.getElementById('chat-header');

export const chatHeader = {
  init(h) {
    handlers = { ...handlers, ...h };
  },

  render() {
    if (!state.activePersonaId) {
      root.innerHTML = '';
      return;
    }

    const p = state.personas.find((x) => x.id === state.activePersonaId);
    const convo = state.conversations[state.activePersonaId] || { activeModel: p?.defaultModel || 'anthropic/claude-sonnet-4-5', lastSeenAt: 0 };
    if (!p) return;

    root.innerHTML = `
      <header class="chat-header">
        <div class="header-left">
          <button class="icon-btn" id="back-btn">Back</button>
          <span class="avatar">${p.avatarUrl ? `<img src="${p.avatarUrl}" alt="${p.name}">` : p.avatarInitials}</span>
          <div>
            <strong>${p.name}</strong>
            <div class="header-sub">${convo.lastSeenAt ? formatLastSeen(convo.lastSeenAt) : 'last seen recently'}</div>
          </div>
        </div>
        <div>
          <button class="icon-btn" id="model-pill">${convo.activeModel}</button>
          <button class="icon-btn" id="clear-chat">⋯</button>
        </div>
      </header>
    `;

    root.querySelector('#back-btn')?.addEventListener('click', handlers.onBack);
    root.querySelector('#model-pill')?.addEventListener('click', handlers.onCycleModel);
    root.querySelector('#clear-chat')?.addEventListener('click', handlers.onClearChat);
  },
};
