import { state } from '../../state.js';
import { renderMessageBubble } from './messageBubble.js';
import { typingIndicator } from './typingIndicator.js';

const root = document.getElementById('message-list');

export const messageList = {
  render() {
    if (!state.activePersonaId) {
      root.innerHTML = '<div class="messages"><p>Select or create a persona to start chatting.</p></div>';
      return;
    }

    const convo = state.conversations[state.activePersonaId] || { messages: [] };
    const box = document.createElement('section');
    box.className = 'messages';

    convo.messages.forEach((m) => {
      box.appendChild(renderMessageBubble(m));
    });

    if (state.showTypingIndicator && state.streamingPersonaId === state.activePersonaId) {
      const holder = document.createElement('div');
      holder.innerHTML = typingIndicator.render();
      box.appendChild(holder.firstElementChild);
    }

    root.innerHTML = '';
    root.appendChild(box);
    box.scrollTop = box.scrollHeight;
  },
};
