import { on, state } from '../state.js';
import { router } from './router.js';
import { sidebar } from './components/sidebar.js';
import { messageList } from './components/messageList.js';
import { chatInput } from './components/chatInput.js';
import { chatHeader } from './components/chatHeader.js';
import { settingsPanel } from './components/settingsPanel.js';
import { personaForm } from './components/personaForm.js';

export function initRender() {
  on('personas:changed', () => {
    sidebar.render();
    chatHeader.render();
    chatInput.render();
  });

  on('view:changed', () => {
    router.navigate(state.view);
    settingsPanel.render();
    personaForm.render();
    chatInput.render();
  });

  on('conversation:updated', () => {
    sidebar.render();
    messageList.render();
    chatHeader.render();
    chatInput.render();
  });

  on('loading:changed', () => {
    chatInput.setDisabled(state.isLoading);
    messageList.render();
  });

  on('settings:changed', () => settingsPanel.render());
  on('voice:changed', () => personaForm.render());

  on('*', () => {
    sidebar.render();
    messageList.render();
    chatHeader.render();
    chatInput.render();
  });
}
