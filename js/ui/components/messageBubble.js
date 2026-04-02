import { formatRelativeTime } from '../../utils.js';

/** @typedef {import('../../types.js').Message} Message */

/** @param {Message} msg */
export function renderMessageBubble(msg) {
  const wrap = document.createElement('article');
  wrap.className = `bubble ${msg.role === 'user' ? 'user' : 'assistant'}`;

  if (msg.contentType === 'voice_note' && msg.audioUrl) {
    wrap.innerHTML = `
      <div class="voice-note">
        <audio controls src="${msg.audioUrl}"></audio>
        <div class="wave">${'<i></i>'.repeat(18)}</div>
        <small>${msg.audioDuration || 0}s</small>
        <details>
          <summary>Transcript</summary>
          <div>${escapeHtml(msg.text || '')}</div>
        </details>
      </div>
      <div class="ts">${formatRelativeTime(msg.timestamp)}</div>
    `;
    return wrap;
  }

  const text = document.createElement('div');
  text.textContent = msg.text || '';
  wrap.appendChild(text);

  if (msg.contentType === 'image' && msg.imageUrl) {
    const img = document.createElement('img');
    img.src = msg.imageUrl;
    img.alt = 'shared image';
    wrap.appendChild(img);
  }

  const ts = document.createElement('div');
  ts.className = 'ts';
  ts.textContent = formatRelativeTime(msg.timestamp);
  wrap.appendChild(ts);

  return wrap;
}

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
