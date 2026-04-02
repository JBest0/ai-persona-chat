import { state } from '../state.js';

/**
 * @param {string} rawUrl
 * @returns {string}
 */
export function getEndpoint(rawUrl) {
  if (state.settings.proxyEnabled && state.settings.proxyUrl) {
    const base = state.settings.proxyUrl.replace(/\/$/, '');
    return `${base}/${rawUrl}`;
  }
  return rawUrl;
}

/**
 * @param {'anthropic'|'deepseek'|'gemini'|'fishAudio'|'braveSearch'} provider
 * @returns {Object}
 */
export function getHeaders(provider) {
  const keys = state.settings.keys || {};
  const proxyActive = state.settings.proxyEnabled && state.settings.proxyUrl;

  if (provider === 'anthropic') {
    const h = {
      'Content-Type': 'application/json',
      'x-api-key': keys.anthropic || '',
      'anthropic-version': '2023-06-01',
    };
    if (!proxyActive) h['anthropic-dangerous-direct-browser-access'] = 'true';
    return h;
  }

  if (provider === 'deepseek') {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keys.deepseek || ''}`,
    };
  }

  if (provider === 'gemini') {
    return { 'Content-Type': 'application/json' };
  }

  if (provider === 'fishAudio') {
    return {
      Authorization: `Bearer ${keys.fishAudio || ''}`,
      'Content-Type': 'application/json',
    };
  }

  if (provider === 'braveSearch') {
    return {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': keys.braveSearch || '',
    };
  }

  return { 'Content-Type': 'application/json' };
}
