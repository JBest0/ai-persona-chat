import { state } from '../state.js';
import { getEndpoint, getHeaders } from './api.js';

/**
 * @param {{ imageBase64: string, mimeType: string, contextPrompt: string }} args
 * @returns {Promise<string>}
 */
export async function describeImage(args) {
  const rawUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${state.settings.keys.gemini || ''}`;
  const url = getEndpoint(rawUrl);

  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: args.mimeType, data: args.imageBase64 } },
        { text: args.contextPrompt },
      ],
    }],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders('gemini'),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || 'No description generated.';
}
