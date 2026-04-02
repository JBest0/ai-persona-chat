import { storage } from './storage.js';
import { state, emit } from '../state.js';
import { initialsFromName, uuid } from '../utils.js';

/** @typedef {import('../types.js').Persona} Persona */

const STORAGE_KEY = 'personas';
const REQUIRED = ['name', 'age', 'gender', 'personality', 'appearance'];

function persist() {
  storage.set(STORAGE_KEY, state.personas);
}

export const personaService = {
  /** @returns {Persona[]} */
  getAll() {
    return [...state.personas].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  /** @param {string} id */
  getById(id) {
    return state.personas.find((p) => p.id === id) || null;
  },

  /** @param {Partial<Persona>} data */
  create(data) {
    REQUIRED.forEach((field) => {
      if (!String(data[field] || '').trim()) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    const now = Date.now();
    /** @type {Persona} */
    const persona = {
      id: uuid(),
      createdAt: now,
      updatedAt: now,
      name: String(data.name || '').trim(),
      age: String(data.age || '').trim(),
      gender: String(data.gender || '').trim(),
      personality: String(data.personality || '').trim(),
      appearance: String(data.appearance || '').trim(),
      nationality: data.nationality || '',
      education: data.education || '',
      occupation: data.occupation || '',
      socioeconomicStatus: data.socioeconomicStatus || '',
      livingSituation: data.livingSituation || '',
      relationshipStatus: data.relationshipStatus || '',
      speakingStyle: data.speakingStyle || '',
      textingHabits: data.textingHabits || '',
      language: data.language || '',
      vocabularyLevel: data.vocabularyLevel || '',
      quirks: data.quirks || '',
      interests: data.interests || '',
      dislikes: data.dislikes || '',
      values: data.values || '',
      fears: data.fears || '',
      goals: data.goals || '',
      flaws: data.flaws || '',
      backstory: data.backstory || '',
      keyRelationships: data.keyRelationships || '',
      definingEvents: data.definingEvents || '',
      secrets: data.secrets || '',
      trauma: data.trauma || '',
      religion: data.religion || '',
      roleToUser: data.roleToUser || '',
      howTheyKnowUser: data.howTheyKnowUser || '',
      emotionalToneToUser: data.emotionalToneToUser || '',
      topicsToAvoid: data.topicsToAvoid || '',
      topicsTheyLove: data.topicsTheyLove || '',
      extraInstructions: data.extraInstructions || '',
      defaultModel: data.defaultModel || 'anthropic/claude-sonnet-4-5',
      voiceId: data.voiceId || '',
      avatarUrl: data.avatarUrl || '',
      avatarInitials: initialsFromName(String(data.name || '')),
      initiativeEnabled: data.initiativeEnabled !== false,
      initiativeFrequency: data.initiativeFrequency || 'medium',
    };

    state.personas.push(persona);
    persist();
    emit('personas:changed', persona);
    return persona;
  },

  /** @param {string} id @param {Partial<Persona>} data */
  update(id, data) {
    const idx = state.personas.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Persona not found');

    const current = state.personas[idx];
    const next = {
      ...current,
      ...data,
      updatedAt: Date.now(),
    };

    REQUIRED.forEach((field) => {
      if (!String(next[field] || '').trim()) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    next.avatarInitials = initialsFromName(next.name);
    state.personas[idx] = next;
    persist();
    emit('personas:changed', next);
    return next;
  },

  /** @param {string} id */
  delete(id) {
    state.personas = state.personas.filter((p) => p.id !== id);
    persist();
    emit('personas:changed', null);
  },

  loadFromStorage() {
    state.personas = storage.get(STORAGE_KEY) || [];
  },
};
