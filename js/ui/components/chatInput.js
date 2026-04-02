import { state } from '../../state.js';

let handlers = {
  onSend: () => {},
};

const root = document.getElementById('chat-input');
let attached = null;
let disabled = false;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export const chatInput = {
  init(h) {
    handlers = { ...handlers, ...h };
    this.render();
  },

  setDisabled(v) {
    disabled = v;
    this.render();
  },

  render() {
    if (!root) return;

    const canChat = Boolean(state.activePersonaId);
    const isDisabled = disabled || !canChat;

    root.innerHTML = `
      <div class="chat-input">
        <div class="input-preview ${attached ? 'active' : ''}">
          ${attached ? `<img src="${attached.preview}" alt="preview"><button class="icon-btn" id="remove-image">×</button>` : ''}
        </div>
        <div class="input-row">
          <label class="icon-btn" id="attach-image-label" for="image-input-field">📎</label>
          <textarea id="message-text" placeholder="${canChat ? 'Type a message' : 'Select or create a persona to start chatting'}" ${isDisabled ? 'disabled' : ''}></textarea>
          <button class="btn primary" id="send-btn" ${isDisabled ? 'disabled' : ''}>Send</button>
        </div>
        <input id="image-input-field" type="file" accept="image/*" style="display:none">
        <div class="input-error" id="input-error">${canChat ? '' : 'Chat is disabled until a persona is selected.'}</div>
      </div>
    `;

    const ta = root.querySelector('#message-text');
    const send = root.querySelector('#send-btn');
    const imageInput = root.querySelector('#image-input-field');
    const err = root.querySelector('#input-error');

    const doSend = async () => {
      if (isDisabled) return;
      const text = ta.value.trim();
      if (!text && !attached) return;

      const img = attached;
      ta.value = '';
      attached = null;
      this.render();

      await handlers.onSend(text, img ? { base64: img.base64, mimeType: img.mimeType } : null);
    };

    ta?.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
    });

    ta?.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await doSend();
      }
    });

    send?.addEventListener('click', doSend);

    imageInput?.addEventListener('change', async () => {
      if (isDisabled) return;
      const file = imageInput.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        err.textContent = 'Image too large. Max 5MB.';
        return;
      }
      err.textContent = '';
      attached = {
        file,
        mimeType: file.type || 'image/png',
        base64: await fileToBase64(file),
        preview: URL.createObjectURL(file),
      };
      this.render();
    });

    root.querySelector('#remove-image')?.addEventListener('click', () => {
      attached = null;
      this.render();
    });
  },
};
