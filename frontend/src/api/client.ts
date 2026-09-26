/**
 * Type-Safe API Client & Financial Utilities — VCE Pali e-Gram
 */

import {
  AuthSession,
  Citizen,
  DashboardData,
  ExpenseItem,
  PanchayatProfile,
  PaymentItem,
  PortalWallet,
  ReportData,
  RojmelData,
  ServiceItem,
  WalletTransaction,
  WorkItem
} from '../types';

const TOKEN_KEY = 'vce_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('vce_auth_user');
  localStorage.removeItem('vce_auth_expires_at');
}

/**
 * Builds API request URL with query parameters
 */
function buildUrl(endpoint: string, params: Record<string, any> = {}): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullPath = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const url = new URL(fullPath, window.location.origin);

  Object.keys(params).forEach(key => {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (item !== undefined && item !== null && item !== '') {
            url.searchParams.append(key, String(item));
          }
        });
      } else {
        url.searchParams.append(key, String(val));
      }
    }
  });

  return url.toString();
}

/**
 * Executes HTTP request with Authorization header and standardized error handling
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any,
  params?: Record<string, any>
): Promise<T> {
  const url = buildUrl(endpoint, params);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      if (!window.location.pathname.includes('/login')) {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}&expired=1`;
      }
    }
    const errData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errData.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => request<T>('GET', endpoint, undefined, params),
  post: <T>(endpoint: string, body?: any) => request<T>('POST', endpoint, body),
  put: <T>(endpoint: string, body?: any) => request<T>('PUT', endpoint, body),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
};

/**
 * Currency and Number Formatting in Indian Numbering System
 */
export function formatINR(paise: number | null | undefined, includeSymbol: boolean = true): string {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

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
    const groups: string[] = [];
    while (rest.length > 2) {
      groups.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest.length > 0) {
      groups.unshift(rest);
    }
    formatted = groups.join(',') + ',' + last3;
  }

  const result = `${formatted}.${remainder.toString().padStart(2, '0')}`;
  if (includeSymbol) {
    return isNegative ? `-₹${result}` : `₹${result}`;
  }
  return isNegative ? `-${result}` : result;
}

/**
 * Converts user input rupees (string/number) to integer paise
 */
export function rupeesToPaise(rupees: number | string | null | undefined): number {
  if (rupees === null || rupees === undefined || rupees === '') return 0;
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer paise to float string rupees for form editing
 */
export function paiseToRupees(paise: number | null | undefined): string {
  if (paise === null || paise === undefined || isNaN(paise)) return '0.00';
  return (paise / 100).toFixed(2);
}

/**
 * Format ISO date string into Indian locale "DD MMM YYYY"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeStr(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

/**
 * Specialized Sub-APIs
 */
export const vceApi = {
  getProfile: () => api.get<PanchayatProfile>('/vce/profile'),
  updateProfile: (data: Partial<PanchayatProfile>) => api.put<PanchayatProfile>('/vce/profile', data),
  getServicesCatalog: () => api.get<ServiceItem[]>('/vce/services-catalog'),
  getWallets: () => api.get<PortalWallet[]>('/vce/wallets'),
  createWallet: (data: any) => api.post<PortalWallet>('/vce/wallets', data),
  topupWallet: (walletId: number, data: { amount: number; reference?: string; reference_no?: string; notes?: string; payment_method?: string }) =>
    api.post<WalletTransaction>(`/vce/wallets/${walletId}/topup`, data),
  getWalletTransactions: (walletId: number) => api.get<WalletTransaction[]>(`/vce/wallets/${walletId}/transactions`),
  getRojmel: (date?: string) => api.get<RojmelData>('/vce/rojmel', date ? { target_date: date } : {}),
  closeDay: (data: { target_date: string; closing_drawer_cash: number; notes?: string }) =>
    api.post<any>('/vce/rojmel/close-day', data),
  getRemittances: (limit: number = 50) => api.get<any[]>('/vce/panchayat-remittances', { limit }),
  createRemittance: (data: { amount: number; payment_mode: string; reference?: string; notes?: string }) =>
    api.post<any>('/vce/panchayat-remittances', data),
  getDeptOrders: () => api.get<any[]>('/vce/dept-orders'),
  createDeptOrder: (data: any) => api.post<any>('/vce/dept-orders', data),
  updateDeptOrder: (orderId: number, data: any) => api.put<any>(`/vce/dept-orders/${orderId}`, data),
  deleteDeptOrder: (orderId: number) => api.delete<any>(`/vce/dept-orders/${orderId}`),
};

export const peopleApi = {
  getAll: (params?: Record<string, any>) => api.get<Citizen[]>('/people', params),
  getById: (id: number) => api.get<Citizen>(`/people/${id}`),
  create: (data: Partial<Citizen>) => api.post<Citizen>('/people', data),
  update: (id: number, data: Partial<Citizen>) => api.put<Citizen>(`/people/${id}`, data),
  delete: (id: number) => api.delete<any>(`/people/${id}`),
};

export const workApi = {
  getAll: (params?: Record<string, any>) => api.get<WorkItem[]>('/work', params),
  getById: (id: number) => api.get<WorkItem>(`/work/${id}`),
  create: (data: Partial<WorkItem>) => api.post<WorkItem>('/work', data),
  update: (id: number, data: Partial<WorkItem>) => api.put<WorkItem>(`/work/${id}`, data),
  delete: (id: number) => api.delete<any>(`/work/${id}`),
};

export const paymentsApi = {
  getAll: (params?: Record<string, any>) => api.get<PaymentItem[]>('/payments', params),
  create: (data: Partial<PaymentItem>) => api.post<PaymentItem>('/payments', data),
  delete: (id: number) => api.delete<any>(`/payments/${id}`),
};

export const expensesApi = {
  getAll: (params?: Record<string, any>) => api.get<ExpenseItem[]>('/expenses', params),
  create: (data: Partial<ExpenseItem>) => api.post<ExpenseItem>('/expenses', data),
  delete: (id: number) => api.delete<any>(`/expenses/${id}`),
};

export const dashboardApi = {
  get: (preset: string = 'this_month', customStart?: string, customEnd?: string) =>
    api.get<DashboardData>('/dashboard', {
      preset,
      start_date: preset === 'custom' ? customStart : undefined,
      end_date: preset === 'custom' ? customEnd : undefined,
    }),
};

export const reportsApi = {
  get: (type: string, preset: string, startDate?: string, endDate?: string) =>
    api.get<ReportData>('/reports', {
      type,
      preset,
      start_date: preset === 'custom' ? startDate : undefined,
      end_date: preset === 'custom' ? endDate : undefined,
    }),
};

export const settingsApi = {
  getWorkCategories: () => api.get<any[]>('/settings/work-categories'),
  createWorkCategory: (data: { name: string }) => api.post<any>('/settings/work-categories', data),
  deleteWorkCategory: (id: number) => api.delete<any>(`/settings/work-categories/${id}`),
  getExpenseCategories: () => api.get<any[]>('/settings/expense-categories'),
  createExpenseCategory: (data: { name: string }) => api.post<any>('/settings/expense-categories', data),
  deleteExpenseCategory: (id: number) => api.delete<any>(`/settings/expense-categories/${id}`),
  getPaymentMethods: () => api.get<any[]>('/settings/payment-methods'),
  createPaymentMethod: (data: { name: string }) => api.post<any>('/settings/payment-methods', data),
  deletePaymentMethod: (id: number) => api.delete<any>(`/settings/payment-methods/${id}`),
};
