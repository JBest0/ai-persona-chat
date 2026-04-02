import { state, emit } from '../state.js';
import { sleep, splitNaturalMessages } from '../utils.js';
import { personaService } from './persona.js';
import { conversationService } from './conversation.js';
import { build as buildSystemPrompt } from './systemPrompt.js';
import { streamChat as streamAnthropic } from './anthropic.js';
import { streamChat as streamDeepseek } from './deepseek.js';
import { describeImage } from './gemini.js';
import { search as braveSearch } from './braveSearch.js';
import { textToSpeech } from './fishAudio.js';

const BRAVE_SEARCH_TOOL = {
  name: 'web_search',
  description: 'Search the web for current information. Use this naturally when you need to look something up, just like a real person would.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query' },
    },
    required: ['query'],
  },
};

function ensureKey(provider) {
  const keyMap = {
    anthropic: 'anthropic',
    deepseek: 'deepseek',
    gemini: 'gemini',
    fishAudio: 'fishAudio',
    braveSearch: 'braveSearch',
  };
  const key = state.settings.keys[keyMap[provider]];
  return Boolean(key);
}

function normalizeModel(model) {
  if (model.startsWith('anthropic/')) return model.includes('haiku') ? 'claude-haiku-4-5' : 'claude-sonnet-4-5';
  if (model.startsWith('deepseek/')) return 'deepseek-chat';
  return 'claude-sonnet-4-5';
}

function toAnthropicMessages(messages) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: [{ type: 'text', text: m.text }] }));
}

function estimateAudioDurationSeconds(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 2.8));
}

function isCorsError(err) {
  const msg = String(err?.message || err || '');
  return /Failed to fetch|NetworkError/i.test(msg);
}

export const chatService = {
  /**
   * @param {{
   *  personaId: string,
   *  content: string,
   *  imageBase64?: string,
   *  imageMimeType?: string,
   *  onChunk?: (text: string) => void,
   *  onVoiceNote?: (blobUrl: string, duration: number) => void,
   * }} args
   */
  async sendMessage(args) {
    const persona = personaService.getById(args.personaId);
    if (!persona) return;

    const convo = conversationService.get(args.personaId);

    let content = (args.content || '').trim();
    let imageDescription = '';

    const userMsg = conversationService.addMessage(args.personaId, {
      role: 'user',
      contentType: args.imageBase64 ? 'image' : 'text',
      text: content,
      imageUrl: args.imageBase64 ? `data:${args.imageMimeType || 'image/png'};base64,${args.imageBase64}` : undefined,
      timestamp: Date.now(),
    });

    let model = convo.activeModel || persona.defaultModel;
    if (args.imageBase64 && model.startsWith('deepseek/')) {
      model = 'anthropic/claude-sonnet-4-5';
    }

    let provider = model.startsWith('deepseek/') ? 'deepseek' : 'anthropic';
    if (!ensureKey(provider)) {
      throw new Error(`Add your ${provider === 'anthropic' ? 'Anthropic' : 'Deepseek'} API key in Settings`);
    }

    state.isLoading = true;
    state.showTypingIndicator = true;
    state.streamingPersonaId = args.personaId;
    emit('loading:changed', true);

    const assistant = conversationService.addMessage(args.personaId, {
      role: 'assistant',
      contentType: 'text',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: model,
    });

    try {
      if (args.imageBase64) {
        try {
          if (!ensureKey('gemini')) throw new Error('A Gemini API key is required to send images. Add it in Settings');
          imageDescription = await describeImage({
            imageBase64: args.imageBase64,
            mimeType: args.imageMimeType || 'image/png',
            contextPrompt: 'Describe this image in detail so that someone who cannot see it can fully understand its content, mood, setting, people, objects, text, and any notable details. Be specific and concrete.',
            model: state.settings.visionModel,
          });
        } catch (err) {
          const reason = isCorsError(err)
            ? 'Unable to analyze the image due to a network/CORS issue. Try enabling the proxy in Settings.'
            : String(err?.message || err || 'Unable to analyze the image.');
          conversationService.updateMessage(args.personaId, assistant.id, {
            text: `I could not read that image. ${reason}`,
            isStreaming: false,
            modelUsed: model,
          });
          return;
        }
      }

      await sleep(Math.random() * 1500 + 500);

      const history = conversationService.trimToTokenBudget(convo.messages.filter((m) => m.id !== assistant.id), 12000);
      const systemPrompt = buildSystemPrompt(persona, imageDescription);
      let output = '';

      if (provider === 'anthropic') {
        const toolResults = [];
        await streamAnthropic({
          systemPrompt,
          tools: [BRAVE_SEARCH_TOOL],
          model: normalizeModel(model),
          messages: [...toAnthropicMessages(history), ...toolResults],
          onChunk: (chunk) => {
            if (state.showTypingIndicator) {
              state.showTypingIndicator = false;
              emit('loading:changed', true);
            }
            output += chunk;
            conversationService.updateMessage(args.personaId, assistant.id, { text: output, isStreaming: true });
            if (args.onChunk) args.onChunk(output);
          },
          onToolCall: async (toolCall) => {
            if (toolCall.name !== 'web_search') return;
            if (!ensureKey('braveSearch')) return;
            const results = await braveSearch({ query: String(toolCall.input.query || ''), count: 3 });
            const toolText = results.map((r, i) => `${i + 1}. ${r.title} - ${r.description} (${r.url})`).join('\n');
            toolResults.push({ role: 'user', content: [{ type: 'text', text: `Web search results:\n${toolText}` }] });
          },
        });

        if (!output && toolResults.length) {
          await streamAnthropic({
            systemPrompt,
            model: normalizeModel(model),
            messages: [...toAnthropicMessages(history), ...toolResults],
            onChunk: (chunk) => {
              if (state.showTypingIndicator) {
                state.showTypingIndicator = false;
                emit('loading:changed', true);
              }
              output += chunk;
              conversationService.updateMessage(args.personaId, assistant.id, { text: output, isStreaming: true });
              if (args.onChunk) args.onChunk(output);
            },
          });
        }
      } else {
        await streamDeepseek({
          systemPrompt,
          model: normalizeModel(model),
          messages: history,
          onChunk: (chunk) => {
            if (state.showTypingIndicator) {
              state.showTypingIndicator = false;
              emit('loading:changed', true);
            }
            output += chunk;
            conversationService.updateMessage(args.personaId, assistant.id, { text: output, isStreaming: true });
            if (args.onChunk) args.onChunk(output);
          },
        });
      }

      const segments = splitNaturalMessages(output);
      conversationService.updateMessage(args.personaId, assistant.id, {
        text: segments[0] || output,
        isStreaming: false,
        modelUsed: model,
      });

      for (let i = 1; i < segments.length; i += 1) {
        await sleep(600 + Math.random() * 600);
        conversationService.addMessage(args.personaId, {
          role: 'assistant',
          contentType: 'text',
          text: segments[i],
          timestamp: Date.now(),
          modelUsed: model,
        });
      }

      if (persona.voiceId && output && output.length < 300 && ensureKey('fishAudio')) {
        try {
          const blob = await textToSpeech({ text: output, voiceId: persona.voiceId });
          const audioUrl = URL.createObjectURL(blob);
          const duration = estimateAudioDurationSeconds(output);
          conversationService.updateMessage(args.personaId, assistant.id, {
            contentType: 'voice_note',
            audioUrl,
            audioDuration: duration,
          });
          if (args.onVoiceNote) args.onVoiceNote(audioUrl, duration);
        } catch {
          // Silent failure for voice notes.
        }
      }

      conversationService.get(args.personaId).lastSeenAt = Date.now();
      conversationService.persist();
    } catch (err) {
      const existing = conversationService.get(args.personaId).messages.find((m) => m.id === assistant.id);
      if (existing && existing.text) {
        conversationService.updateMessage(args.personaId, assistant.id, {
          text: `${existing.text} [message interrupted]`,
          isStreaming: false,
        });
      }
      if (isCorsError(err)) {
        throw new Error('CORS error - try enabling the proxy in Settings');
      }
      throw err;
    } finally {
      state.isLoading = false;
      state.showTypingIndicator = false;
      state.streamingPersonaId = null;
      emit('loading:changed', false);
      if (userMsg) emit('conversation:updated', { personaId: args.personaId });
    }
  },

  /**
   * @param {{ personaId: string, reason: 'first_open'|'time_away', hoursAway?: number, onChunk?: (text:string)=>void }} args
   */
  async triggerInitiative(args) {
    const persona = personaService.getById(args.personaId);
    if (!persona || !persona.initiativeEnabled) return;

    const convo = conversationService.get(args.personaId);
    const model = convo.activeModel || persona.defaultModel;
    const provider = model.startsWith('deepseek/') ? 'deepseek' : 'anthropic';
    if (!ensureKey(provider)) return;

    let extra = '';
    if (args.reason === 'first_open') {
      extra = 'This is the very first time you are texting this person. Send a natural opening message based on your personality and your relationship with them. Keep it short - 1-2 sentences max.';
    }
    if (args.reason === 'time_away') {
      extra = `You have not talked in ${args.hoursAway || 6} hours. Send a natural follow-up message. Reference something from your recent conversation if relevant. Keep it to 1-2 sentences.`;
    }

    state.isLoading = true;
    state.showTypingIndicator = true;
    state.streamingPersonaId = args.personaId;
    emit('loading:changed', true);

    const msg = conversationService.addMessage(args.personaId, {
      role: 'assistant',
      contentType: 'text',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      isInitiative: true,
    });

    try {
      await sleep(Math.random() * 1500 + 500);
      const history = conversationService.trimToTokenBudget(convo.messages.filter((m) => m.id !== msg.id), 12000);
      const systemPrompt = `${buildSystemPrompt(persona)}\n\n${extra}`;
      let out = '';

      if (provider === 'anthropic') {
        await streamAnthropic({
          systemPrompt,
          model: normalizeModel(model),
          messages: toAnthropicMessages(history),
          onChunk: (chunk) => {
            if (state.showTypingIndicator) {
              state.showTypingIndicator = false;
              emit('loading:changed', true);
            }
            out += chunk;
            conversationService.updateMessage(args.personaId, msg.id, { text: out, isStreaming: true, isInitiative: true });
            if (args.onChunk) args.onChunk(out);
          },
        });
      } else {
        await streamDeepseek({
          systemPrompt,
          model: normalizeModel(model),
          messages: history,
          onChunk: (chunk) => {
            if (state.showTypingIndicator) {
              state.showTypingIndicator = false;
              emit('loading:changed', true);
            }
            out += chunk;
            conversationService.updateMessage(args.personaId, msg.id, { text: out, isStreaming: true, isInitiative: true });
            if (args.onChunk) args.onChunk(out);
          },
        });
      }

      conversationService.updateMessage(args.personaId, msg.id, {
        text: out,
        isStreaming: false,
        isInitiative: true,
      });

      if (state.activePersonaId !== args.personaId || state.view !== 'chat') {
        convo.unreadCount += 1;
        conversationService.persist();
        emit('conversation:updated', { personaId: args.personaId, conversation: convo });
      }
    } finally {
      state.isLoading = false;
      state.showTypingIndicator = false;
      state.streamingPersonaId = null;
      emit('loading:changed', false);
    }
  },
};
