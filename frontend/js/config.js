/**
 * VCE Pali — Cloud Backend & Environment Configuration
 * 
 * Manages dynamic resolution between:
 * 1. Default Vercel Edge Proxy (/api -> Render) — Zero CORS, zero setup required.
 * 2. Custom Render Backend URL (stored in localStorage or window.__VCE_BACKEND_URL__)
 * 3. Local Development Server (http://127.0.0.1:8000)
 */

const STORAGE_KEY = 'vce_backend_url';
export const DEFAULT_BACKEND_URL = 'https://vce-pali-backend.onrender.com';


/**
 * Returns the raw configured custom backend URL if set, or empty string.
 */
export function getCustomBackendUrl() {
  try {
    const custom = localStorage.getItem(STORAGE_KEY) || window.__VCE_BACKEND_URL__ || '';
    return custom ? custom.trim().replace(/\/+$/, '') : '';
  } catch {
    return '';
  }
}

/**
 * Resolves the active base URL for API requests.
 * Defaults to '/api' for seamless Vercel edge proxy routing.
 */
export function getApiBaseUrl() {
  const custom = getCustomBackendUrl();
  if (custom) {
    return custom.endsWith('/api') ? custom : `${custom}/api`;
  }
  return '/api';
}

/**
 * Resolves the download URL (e.g. for Android APK distribution).
 */
export function getDownloadBaseUrl() {
  const custom = getCustomBackendUrl();
  if (custom) {
    const rootUrl = custom.replace(/\/api$/, '');
    return `${rootUrl}/download`;
  }
  return '/download';
}

/**
 * Saves or clears the custom backend URL.
 * Pass null or empty string to reset back to default Vercel proxy.
 */
export function setBackendUrl(url) {
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY);
      return '';
    }
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEY, cleanUrl);
    return cleanUrl;
  } catch (e) {
    console.error('Failed to save backend URL to localStorage:', e);
    return '';
  }
}

/**
 * Tests connection to the specified or active backend URL.
 * Returns { ok: boolean, status: number, data: object|null, latencyMs: number, error: string|null }
 */
export async function testBackendConnection(targetUrl = null) {
  let endpoint;
  if (targetUrl) {
    const clean = targetUrl.trim().replace(/\/+$/, '');
    const base = clean.endsWith('/api') ? clean : `${clean}/api`;
    endpoint = `${base}/health`;
  } else {
    endpoint = `${getApiBaseUrl()}/health`;
  }

  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for cold start detection

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, status: res.status, data, latencyMs, error: null };
    } else {
      return { ok: false, status: res.status, data: null, latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
    }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, data: null, latencyMs, error: 'Request timed out (Backend may be starting up)' };
    }
    return { ok: false, status: 0, data: null, latencyMs, error: err.message || 'Unable to connect to backend server' };
  }
}
