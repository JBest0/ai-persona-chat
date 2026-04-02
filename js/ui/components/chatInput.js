import { state } from '../../state.js';

let handlers = {
  onSend: () => {},
};

const root = document.getElementById('chat-input');
let attached = null;
let disabled = false;

const MAX_IMAGE_PX = 1024;

function resizeAndEncodeImage(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Calculate new dimensions keeping aspect ratio
        let { width, height } = img;
        if (width > MAX_IMAGE_PX || height > MAX_IMAGE_PX) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_IMAGE_PX);
            width = MAX_IMAGE_PX;
          } else {
            width = Math.round((width / height) * MAX_IMAGE_PX);
            height = MAX_IMAGE_PX;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        // Always encode as JPEG for smaller size, quality 0.85
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg',
        });
      };
      img.src = String(fr.result);
    };
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
      if (file.size > 20 * 1024 * 1024) {
        err.textContent = 'Image too large. Max 20MB.';
        return;
      }
      err.textContent = '';
      const { base64, mimeType } = await resizeAndEncodeImage(file);
      attached = {
        file,
        mimeType,
        base64,
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
