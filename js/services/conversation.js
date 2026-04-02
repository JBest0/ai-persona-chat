import { state, emit } from '../state.js';
import { storage } from './storage.js';
import { uuid } from '../utils.js';

/** @typedef {import('../types.js').Conversation} Conversation */
/** @typedef {import('../types.js').Message} Message */

const STORAGE_KEY = 'conversations';

function persist() {
  storage.set(STORAGE_KEY, state.conversations);
}

function defaultModelForPersona(personaId) {
  const p = state.personas.find((x) => x.id === personaId);
  return (p && p.defaultModel) || 'anthropic/claude-sonnet-4-5';
}

export const conversationService = {
  /** @param {string} personaId @returns {Conversation} */
  get(personaId) {
    if (!state.conversations[personaId]) {
      state.conversations[personaId] = {
        id: personaId,
        personaId,
        messages: [],
        lastMessageAt: 0,
        unreadCount: 0,
        activeModel: defaultModelForPersona(personaId),
        lastSeenAt: 0,
      };
      persist();
    }
    return state.conversations[personaId];
  },

  /** @param {string} personaId @param {Partial<Message>} message */
  addMessage(personaId, message) {
    const convo = this.get(personaId);
    const msg = {
      id: message.id || uuid(),
      conversationId: convo.id,
      role: message.role || 'assistant',
      contentType: message.contentType || 'text',
      text: message.text || '',
      timestamp: message.timestamp || Date.now(),
      ...message,
    };

    convo.messages.push(msg);
    convo.lastMessageAt = msg.timestamp;
    if (msg.role === 'assistant') convo.lastSeenAt = msg.timestamp;

    persist();
    emit('conversation:updated', { personaId, conversation: convo });
    return msg;
  },

  /** @param {string} personaId @param {string} messageId @param {Partial<Message>} updates */
  updateMessage(personaId, messageId, updates) {
    const convo = this.get(personaId);
    const idx = convo.messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    convo.messages[idx] = { ...convo.messages[idx], ...updates };
    if (convo.messages[idx].role === 'assistant') convo.lastSeenAt = convo.messages[idx].timestamp;
    persist();
    emit('conversation:updated', { personaId, conversation: convo });
  },

  /** @param {string} personaId */
  clearHistory(personaId) {
    const convo = this.get(personaId);
    convo.messages = [];
    convo.lastMessageAt = 0;
    convo.lastSeenAt = 0;
    convo.unreadCount = 0;
    persist();
    emit('conversation:updated', { personaId, conversation: convo });
  },

  /** @param {string} personaId */
  markAsRead(personaId) {
    const convo = this.get(personaId);
    convo.unreadCount = 0;
    persist();
    emit('conversation:updated', { personaId, conversation: convo });
  },

  /**
   * @param {Message[]} messages
   * @param {number} maxTokens
   * @returns {Message[]}
   */
  trimToTokenBudget(messages, maxTokens) {
    const usable = Math.max(0, maxTokens - 2000);
    let used = 0;
    const out = [];

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      const text = msg.text || '';
      const estimate = Math.ceil(text.length / 4);
      if (used + estimate > usable) break;
      used += estimate;
      out.unshift(msg);
    }

    return out;
  },

  loadFromStorage() {
    state.conversations = storage.get(STORAGE_KEY) || {};
  },

  persist,
};
