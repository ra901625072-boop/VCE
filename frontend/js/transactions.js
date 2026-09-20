/**
 * Unified Transactions & Money Ledger Controller — VCE Flow Tracker
 * Anti-AI Human Design: Precision Financial Journal & High-Contrast Tabulars
 */
import { api, formatINR, formatDate, rupeesToPaise } from './api.js';
import { notify } from '../components/notification.js';
import { EmptyState } from '../components/empty_state.js';

let activeType = 'all';

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
          type: p.payment_method.toLowerCase() === 'udhar' ? 'Udhar' : 'Payment',
          date: p.payment_date,
          time: p.payment_time,
          entity: p.person_name,
          work: p.work_title || 'General Flow',
          method: p.payment_method,
          reference: p.transaction_reference,
          amount: p.amount,
          is_income: p.payment_method.toLowerCase() !== 'udhar'
        });
      });
    }

    if (res.results.expenses && activeType !== 'payment' && activeType !== 'udhar') {
      res.results.expenses.forEach(e => {
        combined.push({
          type: 'Expense',
          date: e.expense_date,
          time: e.expense_time,
          entity: e.vendor || 'Direct Expense',
          work: e.title,
          method: e.payment_method,
          reference: e.receipt_ref,
          amount: e.amount,
          is_income: false
        });
      });
    }

    combined.sort((a, b) => {
      const dtA = `${a.date} ${a.time}`;
      const dtB = `${b.date} ${b.time}`;
      return dtB.localeCompare(dtA);
    });

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
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="padding:0;">${EmptyState.transactions()}</td></tr>`;
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
              <span style="font-weight:500; color:var(--text-main);">${r.entity}</span>
            </div>
          </td>
          <td style="color:var(--text-secondary); font-size:0.8rem;">${r.work}</td>
          <td><span class="badge ${methodClass}">${r.method}</span></td>
          <td style="color:var(--text-dim); font-size:0.775rem; font-family:var(--font-mono);">${r.reference || '-'}</td>
          <td style="text-align:right; font-size:0.9rem;">${amountHtml}</td>
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
                <div style="font-weight:600; color:var(--text-main); font-size:0.875rem;">${escapeHtml(r.entity)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.work || '')}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div class="font-tabular" style="font-size:1rem; font-weight:700; color:${amtColor};">${sign}${formatINR(r.amount)}</div>
              <span class="badge ${methodClass}" style="font-size:0.65rem; margin-top:0.2rem;">${r.method}</span>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.725rem; color:var(--text-dim); border-top:1px solid var(--border-subtle); padding-top:0.4rem; margin-top:0.25rem;">
            <span style="display:inline-flex; align-items:center; gap:0.25rem;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${formatDate(r.date)} ${r.time ? `&bull; ${r.time}` : ''}
            </span>
            ${r.reference ? `<span>Ref: <b class="font-mono">${escapeHtml(r.reference)}</b></span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
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
});

window.addEventListener('vce:refresh', () => loadTransactions());
