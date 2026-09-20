/**
 * VCE Pali — Authentication & 8-Hour Session Manager
 * Manages token persistence, 8-hour shift expiry, and route authorization guards.
 */

const TOKEN_KEY = 'vce_auth_token';
const USER_KEY = 'vce_auth_user';
const EXPIRES_AT_KEY = 'vce_auth_expires_at';

export const auth = {
  /**
   * Returns current access token if not expired
   */
  getToken() {
    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Returns current user information
   */
  getUser() {
    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Checks if session has expired past the 8-hour limit
   */
  isSessionExpired() {
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (!expiresAt) return true;
    const expireTime = new Date(expiresAt).getTime();
    if (isNaN(expireTime)) return true;
    return Date.now() >= expireTime;
  },

  /**
   * Checks if user is actively authenticated with a valid session
   */
  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    return Boolean(token) && !this.isSessionExpired();
  },

  /**
   * Returns remaining session duration in milliseconds
   */
  getTimeRemainingMs() {
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (!expiresAt) return 0;
    const expireTime = new Date(expiresAt).getTime();
    if (isNaN(expireTime)) return 0;
    return Math.max(0, expireTime - Date.now());
  },

  /**
   * Returns remaining session formatted as "Xh Ym"
   */
  getTimeRemainingFormatted() {
    const ms = this.getTimeRemainingMs();
    if (ms <= 0) return 'Expired';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  /**
   * Saves login session to localStorage with 8-hour validity
   */
  setSession(data) {
    if (!data || !data.access_token) return;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    // Calculate or save 8-hour expiration
    let expiresAtStr = data.expires_at;
    if (!expiresAtStr && data.expires_in) {
      const expDate = new Date(Date.now() + data.expires_in * 1000);
      expiresAtStr = expDate.toISOString();
    } else if (!expiresAtStr) {
      // Fallback 8 hours = 28,800,000 ms
      const expDate = new Date(Date.now() + 8 * 3600 * 1000);
      expiresAtStr = expDate.toISOString();
    }
    localStorage.setItem(EXPIRES_AT_KEY, expiresAtStr);
  },

  /**
   * Clears all session keys from localStorage
   */
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  },

  /**
   * Authenticate against /api/auth/login
   */
  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(errData.detail || 'Login failed. Please check your credentials.');
    }

    const data = await res.json();
    this.setSession(data);
    return data;
  },

  /**
   * Sign out and redirect to login page
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }
    } finally {
      this.clearSession();
      window.location.href = '/pages/login.html?logged_out=1';
    }
  },

  /**
   * Route guard for protected application pages.
   * Call at the top of protected pages. If unauthenticated or expired, redirects to login.
   */
  requireAuth() {
    // If currently on login page, skip
    if (window.location.pathname.includes('/login.html')) return;

    if (!this.isAuthenticated()) {
      const currentUrl = window.location.pathname + window.location.search;
      const redirectParam = encodeURIComponent(currentUrl);
      const isExpired = localStorage.getItem(TOKEN_KEY) && this.isSessionExpired();
      this.clearSession();
      window.location.replace(`/pages/login.html?redirect=${redirectParam}${isExpired ? '&expired=1' : ''}`);
    }
  },

  /**
   * Route guard for public login page: if already logged in with valid session, redirects to dashboard.
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/pages/dashboard.html';
      window.location.replace(redirect);
    }
  }
};
