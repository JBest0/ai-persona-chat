import { getEndpoint, getHeaders } from './api.js';

/**
 * @param {{ text: string, voiceId: string }} args
 * @returns {Promise<Blob>}
 */
export async function textToSpeech(args) {
  const url = getEndpoint('https://api.fish.audio/v1/tts');
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders('fishAudio'),
    body: JSON.stringify({
      text: args.text,
      reference_id: args.voiceId,
      format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error(`Fish Audio request failed: ${res.status}`);
  return res.blob();
}

/**
 * @returns {Promise<Array<{ id: string, name: string, previewUrl: string }>>}
 */
export async function listVoices() {
  const url = getEndpoint('https://api.fish.audio/v1/model');
  const res = await fetch(url, {
    headers: getHeaders('fishAudio'),
  });
  if (!res.ok) throw new Error(`Fish Audio voices failed: ${res.status}`);
  const json = await res.json();
  return (json?.data || []).map((x) => ({
    id: x.id,
    name: x.title || x.name || 'Voice',
    previewUrl: x.preview_url || '',
  }));
}
