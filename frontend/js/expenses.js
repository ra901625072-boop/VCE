/**
 * Expenses Page Controller — VCE Flow Tracker
 * Anti-AI Human Design: Clean Operating Cost Journal & Tabular Figures
 */
import { api, formatINR, formatDate, rupeesToPaise } from './api.js';
import { notify } from '../components/notification.js';
import { animateNumber } from './animations.js';
import { EmptyState } from '../components/empty_state.js';

let allExpenses = [];
let expenseCategories = [];

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
    allExpenses = expenses;
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
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="padding:0;">${EmptyState.transactions('qa-btn-expense')}</td></tr>`;
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
          <td style="text-align:center; white-space:nowrap;">
            <div style="display:inline-flex; justify-content:center; gap:0.3rem; align-items:center;">
              <button class="btn btn-outline btn-sm btn-edit-exp" data-id="${e.id}" title="Edit Expense" style="padding:0.25rem 0.45rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit</span>
              </button>
              <button class="btn btn-outline btn-sm btn-delete-exp" data-id="${e.id}" title="Delete Expense" style="padding:0.25rem 0.45rem; color:var(--expense);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
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
            <div style="display:flex; gap:0.35rem; align-items:center;">
              <span class="badge badge-waiting" style="font-size:0.7rem;">${escapeHtml(e.category_name || 'General')}</span>
              <button class="btn btn-outline btn-sm btn-edit-exp" data-id="${e.id}" style="padding:0.15rem 0.35rem; font-size:0.7rem;">✏️ Edit</button>
              <button class="btn btn-outline btn-sm btn-delete-exp" data-id="${e.id}" style="padding:0.15rem 0.35rem; font-size:0.7rem; color:var(--expense);">🗑️ Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Bind edit and delete handlers
  document.querySelectorAll('.btn-edit-exp').forEach(btn => {
    btn.addEventListener('click', () => openEditExpenseModal(btn.dataset.id));
  });

  document.querySelectorAll('.btn-delete-exp').forEach(btn => {
    btn.addEventListener('click', () => deleteExpense(btn.dataset.id));
  });
}

async function openEditExpenseModal(expId) {
  let exp = allExpenses.find(x => String(x.id) === String(expId));
  if (!exp) {
    try {
      exp = await api.get(`/expenses/${expId}`);
    } catch (err) {
      notify.error('Could not load expense details');
      return;
    }
  }

  document.getElementById('modal-edit-expense-page')?.remove();
  document.body.style.overflow = 'hidden';

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open';
  modalBackdrop.id = 'modal-edit-expense-page';
  modalBackdrop.innerHTML = `
    <div class="modal-dialog" style="max-width:500px;">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:1.1rem;">✏️</span>
          <h3 class="modal-title">Edit Expense</h3>
        </div>
        <button class="modal-close" id="btn-close-edit-exp-modal">&times;</button>
      </div>
      <form id="edit-exp-page-form">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Expense Title / Item *</label>
            <input type="text" id="edit-exp-title" class="form-control" value="${escapeHtml(exp.title || '')}" required />
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Vendor / Payee</label>
              <input type="text" id="edit-exp-vendor" class="form-control" value="${escapeHtml(exp.vendor || '')}" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Amount (₹) *</label>
              <input type="number" id="edit-exp-amount" class="form-control" step="0.01" min="1" value="${(exp.amount || 0) / 100}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Category</label>
              <select id="edit-exp-cat" class="form-select">
                <option value="">-- Select Category --</option>
                ${expenseCategories.map(c => `<option value="${c.id}" ${exp.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Payment Method</label>
              <select id="edit-exp-method" class="form-select">
                <option value="Cash" ${exp.payment_method === 'Cash' ? 'selected' : ''}>Cash (રોકડ)</option>
                <option value="UPI" ${exp.payment_method === 'UPI' ? 'selected' : ''}>UPI (GPay/PhonePe)</option>
                <option value="Online" ${exp.payment_method === 'Online' ? 'selected' : ''}>Online</option>
                <option value="Bank Transfer" ${exp.payment_method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Date</label>
              <input type="date" id="edit-exp-date" class="form-control" value="${exp.expense_date || ''}" required />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Time</label>
              <input type="time" id="edit-exp-time" class="form-control" value="${(exp.expense_time || '').slice(0, 5)}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Receipt / Bill Ref</label>
            <input type="text" id="edit-exp-ref" class="form-control" value="${escapeHtml(exp.receipt_ref || '')}" />
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Notes</label>
            <textarea id="edit-exp-notes" class="form-control" rows="2">${escapeHtml(exp.notes || '')}</textarea>
          </div>
        </div>
        <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
          <button type="button" class="btn btn-outline" id="btn-cancel-edit-exp-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" style="font-weight:700;">Save Changes</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  const closeEditModal = () => {
    modalBackdrop.remove();
    document.body.style.overflow = '';
  };

  document.getElementById('btn-close-edit-exp-modal').addEventListener('click', closeEditModal);
  document.getElementById('btn-cancel-edit-exp-modal').addEventListener('click', closeEditModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeEditModal();
  });

  document.getElementById('edit-exp-page-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amtRupees = Number(document.getElementById('edit-exp-amount').value) || 0;
    const catVal = document.getElementById('edit-exp-cat').value;

    const payload = {
      title: document.getElementById('edit-exp-title').value.trim(),
      vendor: document.getElementById('edit-exp-vendor').value.trim() || null,
      amount: rupeesToPaise(amtRupees),
      category_id: catVal ? parseInt(catVal, 10) : null,
      payment_method: document.getElementById('edit-exp-method').value,
      expense_date: document.getElementById('edit-exp-date').value,
      expense_time: document.getElementById('edit-exp-time').value || '00:00:00',
      receipt_ref: document.getElementById('edit-exp-ref').value.trim() || null,
      notes: document.getElementById('edit-exp-notes').value.trim() || null
    };

    try {
      await api.put(`/expenses/${expId}`, payload);
      closeEditModal();
      notify.success('Expense updated successfully!');
      loadExpenses();
    } catch (err) {
      notify.error('Failed to update expense: ' + err.message);
    }
  });
}

async function deleteExpense(expId) {
  const exp = allExpenses.find(x => String(x.id) === String(expId));
  const title = exp ? exp.title : `expense #${expId}`;
  const amt = exp ? formatINR(exp.amount) : '';

  if (!confirm(`Are you sure you want to delete expense "${title}" (${amt ? '₹' + amt : ''})?`)) {
    return;
  }

  try {
    await api.delete(`/expenses/${expId}`);
    notify.success('Expense deleted successfully.');
    loadExpenses();
  } catch (err) {
    notify.error('Failed to delete expense: ' + err.message);
  }
}

async function loadExpenseCategories() {
  try {
    const cats = await api.get('/settings/expense-categories');
    expenseCategories = cats;
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
