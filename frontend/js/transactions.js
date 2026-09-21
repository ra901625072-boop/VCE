/**
 * Unified Transactions & Money Ledger Controller — VCE Flow Tracker
 * Anti-AI Human Design: Precision Financial Journal & High-Contrast Tabulars
 */
import { api, formatINR, formatDate, rupeesToPaise } from './api.js';
import { notify } from '../components/notification.js';
import { EmptyState } from '../components/empty_state.js';

let activeType = 'all';
let currentTransactions = [];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

async function loadTransactions() {
  try {
    const q = document.getElementById('filter-query')?.value.trim();
    const method = document.getElementById('filter-method')?.value;
    const minRupees = document.getElementById('filter-min-amt')?.value;
    const maxRupees = document.getElementById('filter-max-amt')?.value;
    const preset = document.getElementById('filter-preset')?.value;
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;

    const minPaise = minRupees ? rupeesToPaise(minRupees) : undefined;
    const maxPaise = maxRupees ? rupeesToPaise(maxRupees) : undefined;

    let types = ['payment', 'expense'];
    if (activeType === 'payment') types = ['payment'];
    if (activeType === 'expense') types = ['expense'];
    if (activeType === 'udhar') types = ['payment'];

    const searchParams = {
      q: q || undefined,
      types: types,
      payment_method: (activeType === 'udhar') ? 'Udhar' : (method || undefined),
      min_amount: minPaise,
      max_amount: maxPaise,
      preset: preset,
      date_from: preset === 'custom' ? dateFrom : undefined,
      date_to: preset === 'custom' ? dateTo : undefined
    };

    const res = await api.get('/search', searchParams);
    
    let combined = [];
    if (res.results.payments) {
      res.results.payments.forEach(p => {
        if (activeType === 'udhar' && p.payment_method.toLowerCase() !== 'udhar') return;
        combined.push({
          id: p.id,
          rawType: 'payment',
          type: p.payment_method.toLowerCase() === 'udhar' ? 'Udhar' : 'Payment',
          date: p.payment_date,
          time: p.payment_time,
          entity: p.person_name,
          work: p.work_title || 'General Flow',
          method: p.payment_method,
          reference: p.transaction_reference,
          amount: p.amount,
          notes: p.notes,
          is_income: p.payment_method.toLowerCase() !== 'udhar'
        });
      });
    }

    if (res.results.expenses && activeType !== 'payment' && activeType !== 'udhar') {
      res.results.expenses.forEach(e => {
        combined.push({
          id: e.id,
          rawType: 'expense',
          type: 'Expense',
          date: e.expense_date,
          time: e.expense_time,
          entity: e.vendor || 'Direct Expense',
          work: e.title,
          method: e.payment_method,
          reference: e.receipt_ref,
          amount: e.amount,
          notes: e.notes,
          category: e.category_name,
          is_income: false
        });
      });
    }

    combined.sort((a, b) => {
      const dtA = `${a.date} ${a.time}`;
      const dtB = `${b.date} ${b.time}`;
      return dtB.localeCompare(dtA);
    });

    currentTransactions = combined;
    renderTransactionsTable(combined);
  } catch (err) {
    console.error(err);
    notify.error('Failed to load transaction ledger');
  }
}

function renderTransactionsTable(records) {
  const tbody = document.getElementById('transactions-table-body');
  const mobileList = document.getElementById('mobile-trans-list');
  const countBadge = document.getElementById('trans-count-badge');
  if (countBadge) countBadge.textContent = `${records.length} records`;

  if (records.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="padding:0;">${EmptyState.transactions()}</td></tr>`;
    if (mobileList) mobileList.innerHTML = `
      <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted);">
        <div style="width:40px; height:40px; margin:0 auto 0.75rem; border-radius:50%; background:var(--bg-surface-elevated); display:flex; align-items:center; justify-content:center; border:1px solid var(--border-subtle); color:var(--text-dim);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div style="font-weight:600; color:var(--text-main); font-size:0.9rem; margin-bottom:0.25rem;">No Transactions Found</div>
        <div style="font-size:0.75rem; color:var(--text-dim);">No financial records match the selected query or filters.</div>
      </div>
    `;
    return;
  }

  if (tbody) {
    tbody.innerHTML = records.map(r => {
      let typeBadge = '';
      let amountHtml = '';

      if (r.type === 'Payment') {
        typeBadge = `<span class="badge badge-completed">Income</span>`;
        amountHtml = `<span class="font-tabular" style="color:var(--revenue-light); font-weight:600;">+${formatINR(r.amount)}</span>`;
      } else if (r.type === 'Expense') {
        typeBadge = `<span class="badge badge-cancelled">Expense</span>`;
        amountHtml = `<span class="font-tabular" style="color:var(--expense-light); font-weight:600;">-${formatINR(r.amount)}</span>`;
      } else {
        typeBadge = `<span class="badge badge-udhar">Udhar</span>`;
        amountHtml = `<span class="font-tabular" style="color:var(--pending-light); font-weight:600;">${formatINR(r.amount)}</span>`;
      }

      const initials = getInitials(r.entity);
      const methodClass = `badge-${r.method.toLowerCase().replace(' ', '-')}`;

      return `
        <tr>
          <td>
            <div style="font-weight:500; color:var(--text-main); font-size:0.825rem;">${formatDate(r.date)}</div>
            <div style="font-size:0.725rem; color:var(--text-dim); font-family:var(--font-mono);">${r.time || ''}</div>
          </td>
          <td>${typeBadge}</td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <div class="avatar-chip" style="width:24px; height:24px; font-size:0.7rem;">${initials}</div>
              <span style="font-weight:500; color:var(--text-main);">${escapeHtml(r.entity || '')}</span>
            </div>
          </td>
          <td style="color:var(--text-secondary); font-size:0.8rem;">${escapeHtml(r.work || '')}</td>
          <td><span class="badge ${methodClass}">${escapeHtml(r.method || '')}</span></td>
          <td style="color:var(--text-dim); font-size:0.775rem; font-family:var(--font-mono);">${escapeHtml(r.reference || '-')}</td>
          <td style="text-align:right; font-size:0.9rem;">${amountHtml}</td>
          <td style="text-align:center; white-space:nowrap;">
            <div style="display:inline-flex; justify-content:center; gap:0.3rem; align-items:center;">
              <button class="btn btn-outline btn-sm btn-edit-trans" data-id="${r.id}" data-raw-type="${r.rawType}" title="Edit Record" style="padding:0.25rem 0.45rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit</span>
              </button>
              <button class="btn btn-outline btn-sm btn-delete-trans" data-id="${r.id}" data-raw-type="${r.rawType}" title="Delete Record" style="padding:0.25rem 0.45rem; color:var(--expense);">
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
    mobileList.innerHTML = records.map(r => {
      let isIncome = r.type === 'Payment';
      let isExpense = r.type === 'Expense';
      let amtColor = isIncome ? 'var(--revenue)' : (isExpense ? 'var(--expense)' : 'var(--pending)');
      let sign = isIncome ? '+' : (isExpense ? '-' : '');
      const initials = getInitials(r.entity);
      const methodClass = `badge-${r.method.toLowerCase().replace(' ', '-')}`;

      return `
        <div class="mobile-card" style="padding:0.75rem 0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
            <div style="display:flex; gap:0.55rem; align-items:center; flex:1;">
              <div class="avatar-chip" style="width:28px; height:28px; font-size:0.75rem;">${initials}</div>
              <div>
                <div style="font-weight:600; color:var(--text-main); font-size:0.875rem;">${escapeHtml(r.entity || '')}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.work || '')}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div class="font-tabular" style="font-size:1rem; font-weight:700; color:${amtColor};">${sign}${formatINR(r.amount)}</div>
              <span class="badge ${methodClass}" style="font-size:0.65rem; margin-top:0.2rem;">${r.method}</span>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.725rem; color:var(--text-dim); border-top:1px solid var(--border-subtle); padding-top:0.4rem; margin-top:0.25rem;">
            <span style="display:inline-flex; align-items:center; gap:0.25rem;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${formatDate(r.date)} ${r.time ? `&bull; ${r.time}` : ''}
            </span>
            <div style="display:flex; gap:0.35rem; align-items:center;">
              ${r.reference ? `<span>Ref: <b class="font-mono">${escapeHtml(r.reference)}</b></span>` : ''}
              <button class="btn btn-outline btn-sm btn-edit-trans" data-id="${r.id}" data-raw-type="${r.rawType}" style="padding:0.15rem 0.35rem; font-size:0.7rem;">✏️ Edit</button>
              <button class="btn btn-outline btn-sm btn-delete-trans" data-id="${r.id}" data-raw-type="${r.rawType}" style="padding:0.15rem 0.35rem; font-size:0.7rem; color:var(--expense);">🗑️ Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Bind edit and delete handlers
  document.querySelectorAll('.btn-edit-trans').forEach(btn => {
    btn.addEventListener('click', () => openEditTransactionModal(btn.dataset.id, btn.dataset.rawType));
  });

  document.querySelectorAll('.btn-delete-trans').forEach(btn => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.id, btn.dataset.rawType));
  });
}

async function openEditTransactionModal(id, rawType) {
  document.getElementById('modal-edit-trans-page')?.remove();
  document.body.style.overflow = 'hidden';

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open active';
  modalBackdrop.id = 'modal-edit-trans-page';
  modalBackdrop.style.zIndex = '100';

  if (rawType === 'payment') {
    let p = null;
    try {
      p = await api.get(`/payments/${id}`);
    } catch (e) {
      notify.error('Could not load payment details');
      return;
    }

    modalBackdrop.innerHTML = `
      <div class="modal-dialog" style="max-width:500px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.1rem;">✏️</span>
            <h3 class="modal-title">Edit Receipt / Payment</h3>
          </div>
          <button class="modal-close" id="btn-close-edit-trans-modal">&times;</button>
        </div>
        <form id="edit-trans-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Citizen</label>
              <input type="text" class="form-control" value="${escapeHtml(p.person_name || 'Citizen')}" readonly style="background:rgba(255,255,255,0.05);" />
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Amount (₹) *</label>
                <input type="number" id="edit-trans-amt" class="form-control" step="0.01" min="1" value="${(p.amount || 0) / 100}" required />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Payment Method</label>
                <select id="edit-trans-method" class="form-select">
                  <option value="Cash" ${p.payment_method === 'Cash' ? 'selected' : ''}>Cash (રોકડ)</option>
                  <option value="UPI" ${p.payment_method === 'UPI' ? 'selected' : ''}>UPI (GPay / PhonePe)</option>
                  <option value="Online" ${p.payment_method === 'Online' ? 'selected' : ''}>Online / Portal</option>
                  <option value="Udhar" ${p.payment_method === 'Udhar' ? 'selected' : ''}>Udhar (બાકી)</option>
                  <option value="Bank Transfer" ${p.payment_method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Payment Date</label>
                <input type="date" id="edit-trans-date" class="form-control" value="${p.payment_date || ''}" required />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Payment Time</label>
                <input type="time" id="edit-trans-time" class="form-control" value="${(p.payment_time || '').slice(0, 5)}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Receipt / Reference No.</label>
              <input type="text" id="edit-trans-ref" class="form-control" value="${escapeHtml(p.transaction_reference || '')}" placeholder="UPI Ref, UTR, or Receipt No." />
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Notes</label>
              <textarea id="edit-trans-notes" class="form-control" rows="2">${escapeHtml(p.notes || '')}</textarea>
            </div>
          </div>
          <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <button type="button" class="btn btn-outline" id="btn-cancel-edit-trans-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-weight:700;">Save Changes</button>
          </div>
        </form>
      </div>
    `;
  } else {
    let exp = null;
    try {
      exp = await api.get(`/expenses/${id}`);
    } catch (e) {
      notify.error('Could not load expense details');
      return;
    }

    modalBackdrop.innerHTML = `
      <div class="modal-dialog" style="max-width:500px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.1rem;">✏️</span>
            <h3 class="modal-title">Edit Expense</h3>
          </div>
          <button class="modal-close" id="btn-close-edit-trans-modal">&times;</button>
        </div>
        <form id="edit-trans-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Expense Title / Item *</label>
              <input type="text" id="edit-trans-title" class="form-control" value="${escapeHtml(exp.title || '')}" required />
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Vendor / Payee</label>
                <input type="text" id="edit-trans-vendor" class="form-control" value="${escapeHtml(exp.vendor || '')}" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Amount (₹) *</label>
                <input type="number" id="edit-trans-amt" class="form-control" step="0.01" min="1" value="${(exp.amount || 0) / 100}" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Payment Method</label>
                <select id="edit-trans-method" class="form-select">
                  <option value="Cash" ${exp.payment_method === 'Cash' ? 'selected' : ''}>Cash</option>
                  <option value="UPI" ${exp.payment_method === 'UPI' ? 'selected' : ''}>UPI</option>
                  <option value="Online" ${exp.payment_method === 'Online' ? 'selected' : ''}>Online</option>
                  <option value="Bank Transfer" ${exp.payment_method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Receipt / Bill Ref</label>
                <input type="text" id="edit-trans-ref" class="form-control" value="${escapeHtml(exp.receipt_ref || '')}" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Expense Date</label>
                <input type="date" id="edit-trans-date" class="form-control" value="${exp.expense_date || ''}" required />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Expense Time</label>
                <input type="time" id="edit-trans-time" class="form-control" value="${(exp.expense_time || '').slice(0, 5)}" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Notes</label>
              <textarea id="edit-trans-notes" class="form-control" rows="2">${escapeHtml(exp.notes || '')}</textarea>
            </div>
          </div>
          <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <button type="button" class="btn btn-outline" id="btn-cancel-edit-trans-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-weight:700;">Save Changes</button>
          </div>
        </form>
      </div>
    `;
  }

  document.body.appendChild(modalBackdrop);

  const closeEditModal = () => {
    modalBackdrop.remove();
    document.body.style.overflow = '';
  };

  document.getElementById('btn-close-edit-trans-modal').addEventListener('click', closeEditModal);
  document.getElementById('btn-cancel-edit-trans-modal').addEventListener('click', closeEditModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeEditModal();
  });

  document.getElementById('edit-trans-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amtRupees = Number(document.getElementById('edit-trans-amt').value) || 0;

    try {
      if (rawType === 'payment') {
        const payload = {
          amount: rupeesToPaise(amtRupees),
          payment_method: document.getElementById('edit-trans-method').value,
          payment_date: document.getElementById('edit-trans-date').value,
          payment_time: document.getElementById('edit-trans-time').value || '00:00:00',
          transaction_reference: document.getElementById('edit-trans-ref').value.trim() || null,
          notes: document.getElementById('edit-trans-notes').value.trim() || null
        };
        await api.put(`/payments/${id}`, payload);
        notify.success('Payment updated successfully!');
      } else {
        const payload = {
          title: document.getElementById('edit-trans-title').value.trim(),
          vendor: document.getElementById('edit-trans-vendor').value.trim() || null,
          amount: rupeesToPaise(amtRupees),
          payment_method: document.getElementById('edit-trans-method').value,
          expense_date: document.getElementById('edit-trans-date').value,
          expense_time: document.getElementById('edit-trans-time').value || '00:00:00',
          receipt_ref: document.getElementById('edit-trans-ref').value.trim() || null,
          notes: document.getElementById('edit-trans-notes').value.trim() || null
        };
        await api.put(`/expenses/${id}`, payload);
        notify.success('Expense updated successfully!');
      }
      closeEditModal();
      loadTransactions();
    } catch (err) {
      notify.error('Failed to update record: ' + err.message);
    }
  });
}

async function deleteTransaction(id, rawType) {
  const item = currentTransactions.find(t => String(t.id) === String(id) && t.rawType === rawType);
  const label = item ? `${item.type} of ₹${formatINR(item.amount)}` : `record #${id}`;

  if (!confirm(`Are you sure you want to delete ${label}? This cannot be undone.`)) {
    return;
  }

  try {
    if (rawType === 'payment') {
      await api.delete(`/payments/${id}`);
    } else {
      await api.delete(`/expenses/${id}`);
    }
    notify.success('Record deleted successfully.');
    loadTransactions();
  } catch (err) {
    notify.error('Failed to delete record: ' + err.message);
  }
}

function initTransactionsPage() {
  loadTransactions();

  // Filter Tabs
  document.querySelectorAll('.trans-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.trans-tab').forEach(t => {
        t.classList.remove('btn-primary', 'active');
        t.classList.add('btn-outline');
      });
      tab.classList.add('btn-primary', 'active');
      tab.classList.remove('btn-outline');

      activeType = tab.dataset.type;
      loadTransactions();
    });
  });

  // Mobile Collapsible Filters Toggle & Active Counter
  const toggleBtn = document.getElementById('btn-toggle-filters');
  const collapsible = document.getElementById('trans-filter-collapsible');
  const activeBadge = document.getElementById('filter-active-badge');

  function updateFilterBadge() {
    let count = 0;
    const method = document.getElementById('filter-method')?.value;
    const minAmt = document.getElementById('filter-min-amt')?.value;
    const maxAmt = document.getElementById('filter-max-amt')?.value;
    const preset = document.getElementById('filter-preset')?.value;

    if (method) count++;
    if (minAmt) count++;
    if (maxAmt) count++;
    if (preset && preset !== 'all') count++;

    if (activeBadge) {
      if (count > 0) {
        activeBadge.textContent = count;
        activeBadge.style.display = 'inline-block';
        toggleBtn?.classList.add('btn-primary');
        toggleBtn?.classList.remove('btn-outline');
      } else {
        activeBadge.style.display = 'none';
        toggleBtn?.classList.remove('btn-primary');
        toggleBtn?.classList.add('btn-outline');
      }
    }
  }

  if (toggleBtn && collapsible) {
    toggleBtn.addEventListener('click', () => {
      collapsible.classList.toggle('is-collapsed');
    });
  }

  // Filter Inputs
  document.getElementById('filter-query')?.addEventListener('input', () => loadTransactions());
  document.getElementById('filter-method')?.addEventListener('change', () => {
    updateFilterBadge();
    loadTransactions();
  });
  document.getElementById('filter-min-amt')?.addEventListener('input', () => {
    updateFilterBadge();
    loadTransactions();
  });
  document.getElementById('filter-max-amt')?.addEventListener('input', () => {
    updateFilterBadge();
    loadTransactions();
  });

  // Date Preset
  document.getElementById('filter-preset')?.addEventListener('change', (e) => {
    const customBox = document.getElementById('custom-date-box');
    if (e.target.value === 'custom') {
      customBox.style.display = 'flex';
    } else {
      customBox.style.display = 'none';
      updateFilterBadge();
      loadTransactions();
    }
  });

  document.getElementById('filter-date-from')?.addEventListener('change', () => {
    updateFilterBadge();
    loadTransactions();
  });
  document.getElementById('filter-date-to')?.addEventListener('change', () => {
    updateFilterBadge();
    loadTransactions();
  });

  // Reset Filters
  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    document.getElementById('filter-query').value = '';
    document.getElementById('filter-method').value = '';
    document.getElementById('filter-min-amt').value = '';
    document.getElementById('filter-max-amt').value = '';
    document.getElementById('filter-preset').value = 'all';
    document.getElementById('custom-date-box').style.display = 'none';
    updateFilterBadge();
    loadTransactions();
  });

  // Top action buttons
  document.getElementById('btn-add-pay-top')?.addEventListener('click', () => {
    document.getElementById('qa-btn-payment')?.click();
  });
  document.getElementById('btn-add-exp-top')?.addEventListener('click', () => {
    document.getElementById('qa-btn-expense')?.click();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initTransactionsPage());
} else {
  initTransactionsPage();
}

window.addEventListener('vce:refresh', () => loadTransactions());
