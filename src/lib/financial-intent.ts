import api, { getStoredToken } from './api';

function actorNamespace() {
  try {
    const payload = JSON.parse(atob((getStoredToken() || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.userId || payload.sub || 'session';
  } catch { return 'session'; }
}
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) :
  value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;

/** A retry after an uncertain response reuses the same financial command. */
export async function postFinancialOperation<T = unknown>(path: string, payload: Record<string, unknown>) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical({ actor: actorNamespace(), path, payload }))));
  const fingerprint = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  const storageKey = `altitud2707:financial-intent:${fingerprint}`;
  const key = sessionStorage.getItem(storageKey) || crypto.randomUUID();
  sessionStorage.setItem(storageKey, key);
  const response = await api.post<T>(path, payload, { headers: { 'Idempotency-Key': key } });
  if (sessionStorage.getItem(storageKey) === key) sessionStorage.removeItem(storageKey);
  return response;
}
