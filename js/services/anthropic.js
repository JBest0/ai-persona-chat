import { getEndpoint, getHeaders } from './api.js';

const TOOL_START = 'content_block_start';
const TOOL_DELTA = 'content_block_delta';
const DELTA = 'content_block_delta';

/**
 * @param {{
 *  systemPrompt: string,
 *  messages: Array<any>,
 *  tools?: Array<any>,
 *  onChunk: (text: string) => void,
 *  onToolCall?: (tool: {name: string, input: any}) => Promise<void> | void,
 *  signal?: AbortSignal,
 *  model?: string,
 * }} args
 */
export async function streamChat(args) {
  const url = getEndpoint('https://api.anthropic.com/v1/messages');
  const body = {
    model: args.model || 'claude-sonnet-4-5',
    max_tokens: 900,
    system: args.systemPrompt,
    messages: args.messages,
    stream: true,
  };

  if (args.tools && args.tools.length) body.tools = args.tools;

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders('anthropic'),
    body: JSON.stringify(body),
    signal: args.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Anthropic request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let toolName = '';
  let toolInput = '';

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

      if (payload.type === DELTA && payload.delta && payload.delta.text) {
        args.onChunk(payload.delta.text);
      }

      if (payload.type === TOOL_START && payload.content_block?.type === 'tool_use') {
        toolName = payload.content_block.name || '';
        toolInput = '';
      }

      if (payload.type === TOOL_DELTA && payload.delta?.type === 'input_json_delta') {
        toolInput += payload.delta.partial_json || '';
      }

      if (payload.type === 'content_block_stop' && toolName && toolInput) {
        try {
          const parsed = JSON.parse(toolInput);
          if (args.onToolCall) await args.onToolCall({ name: toolName, input: parsed });
        } finally {
          toolName = '';
          toolInput = '';
        }
      }

      if (payload.type === 'message_stop') {
        return;
      }
    }
  }
}
