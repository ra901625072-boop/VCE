import { auth } from './auth.js';

const API_BASE = '/api';

function getHeaders(customHeaders = {}) {
  const headers = { ...customHeaders };
  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleAuthError(res) {
  if (res.status === 401) {
    auth.clearSession();
    if (!window.location.pathname.includes('/login.html')) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(currentUrl)}&expired=1`;
    }
  }
}

export const api = {
  async get(endpoint, params = {}) {
    const url = new URL(API_BASE + endpoint, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    const res = await fetch(url.toString(), {
      headers: getHeaders()
    });
    if (!res.ok) {
      handleAuthError(res);
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  },

  async post(endpoint, data = {}) {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      handleAuthError(res);
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  },

  async put(endpoint, data = {}) {
    const res = await fetch(API_BASE + endpoint, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      handleAuthError(res);
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  },

  async delete(endpoint) {
    const res = await fetch(API_BASE + endpoint, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok && res.status !== 204) {
      handleAuthError(res);
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }
    return true;
  }
};

/**
 * Currency and Number Formatting in Indian Numbering System
 */
export function formatINR(paise, includeSymbol = true) {
  if (paise === null || paise === undefined) return includeSymbol ? '₹0.00' : '0.00';
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainder = absPaise % 100;

  const s = rupees.toString();
  let formatted = '';
  if (s.length <= 3) {
    formatted = s;
  } else {
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const groups = [];
    while (rest.length > 2) {
      groups.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest.length > 0) {
      groups.unshift(rest);
    }
    formatted = groups.join(',') + ',' + last3;
  }

  if (includeSymbol) {
    return isNegative ? `-₹${formatted}.${remainder.toString().padStart(2, '0')}` : `₹${formatted}.${remainder.toString().padStart(2, '0')}`;
  }
  return `${isNegative ? '-' : ''}${formatted}.${remainder.toString().padStart(2, '0')}`;
}

/**
 * Converts user-input rupees to integer paise
 */
export function rupeesToPaise(rupees) {
  if (!rupees) return 0;
  const num = parseFloat(rupees);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer paise to float rupees for form editing
 */
export function paiseToRupees(paise) {
  if (!paise) return 0;
  return (paise / 100).toFixed(2);
}

/**
 * Date formatting helpers
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeStr() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

export const vceApi = {
  getProfile: () => api.get('/vce/profile'),
  updateProfile: (data) => api.put('/vce/profile', data),
  getServicesCatalog: () => api.get('/vce/services-catalog'),
  getWallets: () => api.get('/vce/wallets'),
  createWallet: (data) => api.post('/vce/wallets', data),
  topupWallet: (walletId, data) => api.post(`/vce/wallets/${walletId}/topup`, data),
  getWalletTransactions: (walletId) => api.get(`/vce/wallets/${walletId}/transactions`),
  getDeptOrders: () => api.get('/vce/dept-orders'),
  createDeptOrder: (data) => api.post('/vce/dept-orders', data),
  updateDeptOrder: (orderId, data) => api.put(`/vce/dept-orders/${orderId}`, data),
  deleteDeptOrder: (orderId) => api.delete(`/vce/dept-orders/${orderId}`),
  getRojmel: (date) => api.get('/vce/rojmel', date ? { target_date: date } : {}),
  getRemittances: (limit = 50) => api.get('/vce/panchayat-remittances', { limit }),
  createRemittance: (data) => api.post('/vce/panchayat-remittances', data),
  getDayClose: (dateStr) => api.get(`/vce/rojmel/close-day/${dateStr}`),
  closeDay: (data) => api.post('/vce/rojmel/close-day', data)
};
