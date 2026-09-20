/**
 * Expenses Page Controller — VCE Flow Tracker
 * Anti-AI Human Design: Clean Operating Cost Journal & Tabular Figures
 */
import { api, formatINR, formatDate } from './api.js';
import { notify } from '../components/notification.js';
import { animateNumber } from './animations.js';
import { EmptyState } from '../components/empty_state.js';

function getInitials(name) {
  if (!name) return 'EX';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

async function loadExpenses() {
  try {
    const q = document.getElementById('exp-search-input')?.value.trim();
    const category_id = document.getElementById('exp-category-filter')?.value || undefined;
    const payment_method = document.getElementById('exp-method-filter')?.value || undefined;

    const expenses = await api.get('/expenses', { q, category_id, payment_method });
    renderExpensesTable(expenses);
  } catch (err) {
    console.error(err);
    notify.error('Failed to load expenses');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expenses-table-body');
  const mobileList = document.getElementById('mobile-expenses-list');
  const totalBadge = document.getElementById('exp-total-badge');
  const countBadge = document.getElementById('exp-count-badge');

  if (countBadge) countBadge.textContent = `${expenses.length} records`;

  const totalPaise = expenses.reduce((sum, e) => sum + e.amount, 0);
  if (totalBadge) {
    totalBadge.textContent = `Total: ${formatINR(totalPaise)}`;
  }

  if (expenses.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="padding:0;">${EmptyState.transactions('qa-btn-expense')}</td></tr>`;
    if (mobileList) mobileList.innerHTML = `<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.875rem;">No expense records found matching filters.</div>`;
    return;
  }

  if (tbody) {
    tbody.innerHTML = expenses.map(e => {
      const initials = getInitials(e.vendor || e.title);
      const methodClass = `badge-${e.payment_method.toLowerCase().replace(' ', '-')}`;

      return `
        <tr>
          <td>
            <div style="font-weight:500; color:var(--text-main); font-size:0.825rem;">${formatDate(e.expense_date)}</div>
            <div style="font-size:0.725rem; color:var(--text-dim); font-family:var(--font-mono);">${e.expense_time || ''}</div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.65rem;">
              <div class="avatar-chip" style="width:26px; height:26px; font-size:0.725rem;">${initials}</div>
              <div>
                <div style="font-weight:600; color:var(--text-main); font-size:0.875rem;">${escapeHtml(e.title)}</div>
                <div style="font-size:0.75rem; color:var(--text-dim);">${e.vendor ? `Vendor / Payee: ${escapeHtml(e.vendor)}` : 'General Expense'}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-waiting">${escapeHtml(e.category_name || 'General')}</span></td>
          <td><span class="badge ${methodClass}">${escapeHtml(e.payment_method)}</span></td>
          <td class="font-tabular" style="text-align:right; font-weight:700; color:var(--expense-light); font-size:0.9rem;">-${formatINR(e.amount)}</td>
        </tr>
      `;
    }).join('');
  }

  if (mobileList) {
    mobileList.innerHTML = expenses.map(e => {
      const initials = getInitials(e.vendor || e.title);
      const methodClass = `badge-${e.payment_method.toLowerCase().replace(' ', '-')}`;

      return `
        <div class="mobile-card" style="padding:0.75rem 0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
            <div style="display:flex; gap:0.55rem; align-items:center; flex:1;">
              <div class="avatar-chip" style="width:28px; height:28px; font-size:0.75rem; background:rgba(220,38,38,0.12); color:var(--expense);">${initials}</div>
              <div>
                <div style="font-weight:600; color:var(--text-main); font-size:0.875rem;">${escapeHtml(e.title)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${e.vendor ? `Vendor: ${escapeHtml(e.vendor)}` : 'General Center Expense'}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div class="font-tabular" style="font-size:1rem; font-weight:700; color:var(--expense); font-family:var(--font-mono);">-${formatINR(e.amount)}</div>
              <span class="badge ${methodClass}" style="font-size:0.65rem; margin-top:0.2rem;">${escapeHtml(e.payment_method)}</span>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.725rem; color:var(--text-dim); border-top:1px solid var(--border-subtle); padding-top:0.4rem; margin-top:0.35rem;">
            <span style="display:inline-flex; align-items:center; gap:0.25rem;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${formatDate(e.expense_date)} ${e.expense_time ? `&bull; ${e.expense_time}` : ''}
            </span>
            <span class="badge badge-waiting" style="font-size:0.7rem;">${escapeHtml(e.category_name || 'General')}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

async function loadExpenseCategories() {
  try {
    const cats = await api.get('/settings/expense-categories');
    const select = document.getElementById('exp-category-filter');
    if (select) {
      select.innerHTML = '<option value="">All Categories</option>' +
        cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadExpenseCategories();
  loadExpenses();

  document.getElementById('exp-search-input')?.addEventListener('input', () => loadExpenses());
  document.getElementById('exp-category-filter')?.addEventListener('change', () => loadExpenses());
  document.getElementById('exp-method-filter')?.addEventListener('change', () => loadExpenses());

  document.getElementById('btn-add-exp-top')?.addEventListener('click', () => {
    document.getElementById('qa-btn-expense')?.click();
  });
});

window.addEventListener('vce:refresh', () => loadExpenses());
