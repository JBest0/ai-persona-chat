import { state } from '../../state.js';
import { formatRelativeTime, truncate } from '../../utils.js';

let handlers = {
  onOpenChat: () => {},
  onOpenPersonaForm: () => {},
  onDeletePersona: () => {},
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
        <div class="persona-end">
          ${convo.unreadCount ? `<span class="unread">${convo.unreadCount}</span>` : '<span></span>'}
          <div class="persona-menu-wrap" data-id="${p.id}">
            <button type="button" class="persona-more" aria-label="More actions for ${p.name}">...</button>
            <div class="persona-menu hidden">
              <button type="button" class="persona-menu-item" data-action="edit">Edit</button>
              <button type="button" class="persona-menu-item danger" data-action="delete">Delete</button>
            </div>
          </div>
        </div>
      `;
      list.appendChild(row);
    });

    const closeMenus = () => {
      list.querySelectorAll('.persona-menu').forEach((menu) => menu.classList.add('hidden'));
    };

    list.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const more = target.closest('.persona-more');
      if (more) {
        event.stopPropagation();
        const wrap = more.closest('.persona-menu-wrap');
        const menu = wrap?.querySelector('.persona-menu');
        const opening = Boolean(menu?.classList.contains('hidden'));
        closeMenus();
        if (menu && opening) menu.classList.remove('hidden');
        return;
      }

      const action = target.closest('.persona-menu-item');
      if (action) {
        event.stopPropagation();
        const wrap = action.closest('.persona-menu-wrap');
        const personaId = wrap?.dataset.id;
        const actionType = action.dataset.action;
        closeMenus();

        if (!personaId || !actionType) return;
        if (actionType === 'edit') handlers.onOpenPersonaForm(personaId);
        if (actionType === 'delete' && window.confirm('Delete this persona?')) {
          handlers.onDeletePersona(personaId);
        }
        return;
      }

      closeMenus();
      const row = target.closest('.persona-item');
      if (row?.dataset.id) handlers.onOpenChat(row.dataset.id);
    });

    root.querySelector('#new-persona')?.addEventListener('click', () => handlers.onOpenPersonaForm(null));
    root.querySelector('#open-settings')?.addEventListener('click', handlers.onOpenSettings);
  },
};
