import { state } from '../state.js';

const sidebar = document.getElementById('sidebar-panel');
const chat = document.getElementById('chat-panel');
const settings = document.getElementById('settings-panel');
const personaForm = document.getElementById('persona-form-panel');

export const router = {
  /** @param {'sidebar'|'chat'|'settings'|'persona-form'} view */
  navigate(view) {
    const mobile = window.matchMedia('(max-width: 900px)').matches;

    settings.classList.add('hidden');
    personaForm.classList.add('hidden');

    if (mobile) {
      if (view === 'sidebar') {
        sidebar.classList.add('mobile-only');
        chat.classList.add('mobile-hidden');
      } else {
        sidebar.classList.remove('mobile-only');
        chat.classList.remove('mobile-hidden');
      }
    }

    if (view === 'settings') settings.classList.remove('hidden');
    if (view === 'persona-form') personaForm.classList.remove('hidden');

    if (!state.activePersonaId && view === 'chat') {
      sidebar.classList.add('mobile-only');
      chat.classList.add('mobile-hidden');
    }
  },
};
