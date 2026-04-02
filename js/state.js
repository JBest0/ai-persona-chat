/** @typedef {import('./types.js').Persona} Persona */
/** @typedef {import('./types.js').Conversation} Conversation */
/** @typedef {import('./types.js').AppSettings} AppSettings */

export const state = {
  /** @type {Persona[]} */
  personas: [],

  /** @type {string|null} */
  activePersonaId: null,

  /** @type {Object.<string, Conversation>} */
  conversations: {},

  /** @type {'sidebar'|'chat'|'settings'|'persona-form'} */
  view: 'sidebar',

  /** @type {AppSettings} */
  settings: {
    keys: {},
    proxyEnabled: false,
    proxyUrl: '',
    visionModel: 'gemini-2.5-flash',
  },

  /** @type {boolean} */
  isLoading: false,

  /** @type {boolean} */
  showTypingIndicator: false,

  /** @type {string|null} */
  streamingPersonaId: null,

  /** @type {Array<{id:string,name:string,previewUrl:string}>} */
  voiceOptions: [],
};

const listeners = {};

/**
 * @param {string} event
 * @param {(payload: any) => void} fn
 */
export function on(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
}

/**
 * @param {string} event
 * @param {any} [payload]
 */
export function emit(event, payload) {
  (listeners[event] || []).forEach((fn) => fn(payload));
  (listeners['*'] || []).forEach((fn) => fn(event, payload));
}
