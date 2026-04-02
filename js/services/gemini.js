import { state } from '../state.js';
import { getEndpoint, getHeaders } from './api.js';

export const VISION_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (stable, recommended)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (stable, best quality)' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (latest, may have quota issues)' },
];

export const DEFAULT_VISION_MODEL = 'gemini-2.5-flash';

/**
 * @param {{ imageBase64: string, mimeType: string, contextPrompt: string, model?: string }} args
 * @returns {Promise<string>}
 */
export async function describeImage(args) {
  const model = args.model || DEFAULT_VISION_MODEL;
  const rawUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${state.settings.keys.gemini || ''}`;
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
