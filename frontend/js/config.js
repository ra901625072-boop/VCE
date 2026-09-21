/**
 * VCE Pali — Cloud Backend & Environment Configuration
 * 
 * Vercel connects directly to the Render backend (https://vce-pali-backend.onrender.com)
 * by default through Vercel's zero-CORS edge proxy rewrites (/api/*).
 * No manual connection setup or configuration is required.
 */

// Purge any legacy/stale custom backend URLs in localStorage so default connection is always used
try {
  localStorage.removeItem('vce_backend_url');
} catch (e) {}

export const DEFAULT_BACKEND_URL = 'https://vce-pali-backend.onrender.com';

/**
 * Resolves the active base URL for API requests.
 * Defaults to '/api' for seamless Vercel edge proxy routing to the Render backend.
 * Falls back to Render backend directly if opened via standalone file:// or unproxied local dev port.
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    if (protocol === 'file:' || ((hostname === 'localhost' || hostname === '127.0.0.1') && port && port !== '8000' && port !== '3000')) {
      return `${DEFAULT_BACKEND_URL}/api`;
    }
  }
  return '/api';
}

/**
 * Resolves the download URL (e.g. for Android APK distribution).
 */
export function getDownloadBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    if (protocol === 'file:' || ((hostname === 'localhost' || hostname === '127.0.0.1') && port && port !== '8000' && port !== '3000')) {
      return `${DEFAULT_BACKEND_URL}/download`;
    }
  }
  return '/download';
}

/**
 * Legacy compatibility helper
 */
export function getCustomBackendUrl() {
  return '';
}

/**
 * Legacy compatibility helper
 */
export function setBackendUrl() {
  return '';
}

/**
 * Helper to test connection to backend health endpoint.
 */
export async function testBackendConnection(targetUrl = null) {
  const base = targetUrl ? targetUrl.replace(/\/+$/, '') : getApiBaseUrl();
  const endpoint = base.endsWith('/api') ? `${base}/health` : `${base}/api/health`;

  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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
      return { ok: false, status: 0, data: null, latencyMs, error: 'Request timed out' };
    }
    return { ok: false, status: 0, data: null, latencyMs, error: err.message || 'Unable to connect' };
  }
}
