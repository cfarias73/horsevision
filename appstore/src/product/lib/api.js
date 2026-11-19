const RAILWAY_API_BASE = 'https://backend-production-6dd9c5f0.up.railway.app';

const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const apiBase = configuredBase || (import.meta.env.DEV ? '' : RAILWAY_API_BASE);

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${normalizedPath}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
