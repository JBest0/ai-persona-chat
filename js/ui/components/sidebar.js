import { state } from '../../state.js';
import { formatRelativeTime, truncate } from '../../utils.js';

let handlers = {
  onOpenChat: () => {},
  onOpenPersonaForm: () => {},
  onOpenSettings: () => {},
};

const root = document.getElementById('sidebar-panel');

export const sidebar = {
  init(h) {
    handlers = { ...handlers, ...h };
  },

  render() {
    const personas = [...state.personas].sort((a, b) => {
      const aTime = state.conversations[a.id]?.lastMessageAt || 0;
      const bTime = state.conversations[b.id]?.lastMessageAt || 0;
      return bTime - aTime;
    });

    root.innerHTML = `
      <div class="sidebar-top">
        <strong>Personas</strong>
        <div>
          <button class="icon-btn" id="new-persona">New</button>
          <button class="icon-btn" id="open-settings">Settings</button>
        </div>
      </div>
      <div class="persona-list"></div>
    `;

    const list = root.querySelector('.persona-list');

    personas.forEach((p) => {
      const convo = state.conversations[p.id] || { messages: [], lastMessageAt: 0, unreadCount: 0 };
      const last = convo.messages[convo.messages.length - 1];
      const row = document.createElement('div');
      row.className = `persona-item ${state.activePersonaId === p.id ? 'active' : ''}`;
      row.dataset.id = p.id;

      const avatar = p.avatarUrl
        ? `<span class="avatar"><img src="${p.avatarUrl}" alt="${p.name}"></span>`
        : `<span class="avatar">${p.avatarInitials}</span>`;

      row.innerHTML = `
        ${avatar}
        <div class="meta">
          <div class="name-row">
            <strong>${p.name}</strong>
            <small>${convo.lastMessageAt ? formatRelativeTime(convo.lastMessageAt) : ''}</small>
          </div>
          <div class="preview">${last ? truncate(last.text, 40) : 'No messages yet'}</div>
        </div>
        ${convo.unreadCount ? `<span class="unread">${convo.unreadCount}</span>` : '<span></span>'}
      `;
      row.addEventListener('click', () => handlers.onOpenChat(p.id));
      list.appendChild(row);
    });

    root.querySelector('#new-persona')?.addEventListener('click', () => handlers.onOpenPersonaForm(null));
    root.querySelector('#open-settings')?.addEventListener('click', handlers.onOpenSettings);
  },
};
