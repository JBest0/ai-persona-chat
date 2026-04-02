import { getEndpoint, getHeaders } from './api.js';

/**
 * @param {{query: string, count?: number}} args
 * @returns {Promise<Array<{title: string, url: string, description: string}>>}
 */
export async function search(args) {
  const count = args.count || 3;
  const rawUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(args.query)}&count=${count}`;
  const url = getEndpoint(rawUrl);
  const res = await fetch(url, { headers: getHeaders('braveSearch') });
  if (!res.ok) throw new Error(`Brave Search failed: ${res.status}`);
  const json = await res.json();
  return (json?.web?.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));
}
