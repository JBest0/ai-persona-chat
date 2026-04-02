import { getEndpoint, getHeaders } from './api.js';

/**
 * @param {{
 *  systemPrompt: string,
 *  messages: Array<any>,
 *  onChunk: (text: string) => void,
 *  signal?: AbortSignal,
 *  model?: string,
 * }} args
 */
export async function streamChat(args) {
  if (args.messages.some((m) => m.contentType === 'image')) {
    throw new Error('Vision not supported on Deepseek - switching to Anthropic.');
  }

  const url = getEndpoint('https://api.deepseek.com/v1/chat/completions');
  const body = {
    model: args.model || 'deepseek-chat',
    stream: true,
    messages: [
      { role: 'system', content: args.systemPrompt },
      ...args.messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders('deepseek'),
    body: JSON.stringify(body),
    signal: args.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Deepseek request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;
      const raw = dataLine.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        continue;
      }

      const delta = payload.choices?.[0]?.delta?.content;
      if (delta) args.onChunk(delta);
    }
  }
}
