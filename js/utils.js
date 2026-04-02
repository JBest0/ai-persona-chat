/**
 * @returns {string}
 */
export function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {number} ts
 * @returns {string}
 */
export function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 45) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day}d ago`;

  return new Date(ts).toLocaleString();
}

/**
 * @param {number} ts
 * @returns {string}
 */
export function formatLastSeen(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `last seen today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `last seen ${formatRelativeTime(ts)}`;
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitNaturalMessages(text) {
  const byParagraph = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (byParagraph.length > 1) return byParagraph;

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  if (sentences.length >= 3) {
    const midpoint = Math.ceil(sentences.length / 2);
    const first = sentences.slice(0, midpoint).join(' ').trim();
    const second = sentences.slice(midpoint).join(' ').trim();
    return [first, second].filter(Boolean);
  }
  return [text.trim()].filter(Boolean);
}

/**
 * @param {string} name
 * @returns {string}
 */
export function initialsFromName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'AI';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

/**
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
