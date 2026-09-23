/**
 * Dashboard Page Logic — VCE Pali e-Gram Center & Financial Ledger
 */
import { api, vceApi, formatINR, formatDate, getTodayDateStr, rupeesToPaise } from './api.js';
import { animateNumber, flashMetric, animateProgressBar } from './animations.js';

let currentPreset = 'this_month';
let customStart = null;
let customEnd = null;

async function loadDashboard() {
  try {
    const params = { preset: currentPreset };
    if (currentPreset === 'custom') {
      params.start_date = customStart;
      params.end_date = customEnd;
    }

    const data = await api.get('/dashboard', params);
    renderPanchayatHeader(data.panchayat_profile);
    renderMetrics(data.metrics);
    renderPortalWallets(data.portal_wallets, data.metrics.portal_wallets_balance);
    renderPendingDeptOrders(data.pending_dept_orders, data.metrics.pending_dept_claims);
    renderTrendBars(data.revenue_vs_expenses_trend);
    renderExpenseBreakdown(data.expenses_by_category);
    renderTodayWorkTable(data.todays_work);
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

function renderPanchayatHeader(profile) {
  const titleEl = document.getElementById('dash-gp-title');
  const subtitleEl = document.getElementById('dash-gp-subtitle');
  const gpName = (profile && profile.gram_panchayat && profile.gram_panchayat.trim()) ? profile.gram_panchayat.trim() : '';
  if (titleEl) {
    titleEl.textContent = gpName ? `${gpName} — e-Gram Center` : 'e-Gram Center Dashboard';
  }
  if (subtitleEl) {
    const parts = [];
    if (profile && profile.taluka && profile.taluka.trim()) parts.push(`Taluka: ${profile.taluka.trim()}`);
    if (profile && profile.district && profile.district.trim()) parts.push(`District: ${profile.district.trim()}`);
    if (profile && profile.center_id && profile.center_id.trim()) parts.push(`Center ID: ${profile.center_id.trim()}`);
    if (profile && profile.vce_name && profile.vce_name.trim()) parts.push(`VCE: ${profile.vce_name.trim()}`);
    if (profile && profile.talati_name && profile.talati_name.trim()) parts.push(`Talati: ${profile.talati_name.trim()}`);

    subtitleEl.textContent = parts.length > 0
      ? parts.join(' | ')
      : 'ગુજરાત સરકાર • પંચાયત, ગ્રામ ગૃહનિર્માણ અને ગ્રામ વિકાસ વિભાગ | e-Gram Vishwagram Project';
  }
}

function renderMetrics(m) {
  const revEl = document.getElementById('val-today-revenue');
  const expEl = document.getElementById('val-today-expenses');
  const profEl = document.getElementById('val-today-profit');
  const udharEl = document.getElementById('val-pending-udhar');

  animateNumber(revEl, m.today_revenue, 200, () => {
    if (m.today_revenue > 0) flashMetric(revEl, 'revenue');
  });
  animateNumber(expEl, m.today_expenses, 200, () => {
    if (m.today_expenses > 0) flashMetric(expEl, 'expense');
  });
  animateNumber(profEl, m.today_profit, 200, () => {
    if (m.today_profit !== 0) flashMetric(profEl, m.today_profit > 0 ? 'revenue' : 'expense');
  });
  animateNumber(udharEl, m.total_pending_udhar, 200, () => {
    if (m.total_pending_udhar > 0) flashMetric(udharEl, 'pending');
  });

  // Cash vs UPI subtext
  const cashSub = document.getElementById('sub-dash-cash');
  const upiSub = document.getElementById('sub-dash-upi');
  if (cashSub) cashSub.textContent = formatINR(m.today_citizen_cash || 0);
  if (upiSub) upiSub.textContent = formatINR(m.today_citizen_upi || 0);

  // Period totals
  animateNumber(document.getElementById('val-period-revenue'), m.period_revenue);
  animateNumber(document.getElementById('val-period-commission'), m.net_commission_revenue || 0);
  animateNumber(document.getElementById('val-period-expenses'), m.period_expenses);
  animateNumber(document.getElementById('val-period-profit'), m.period_profit);
  animateNumber(document.getElementById('val-panchayat-share'), m.panchayat_share_payable || 0);

  const remittedSub = document.getElementById('sub-panchayat-remitted');
  if (remittedSub) {
    remittedSub.textContent = `Remitted: ${formatINR(m.total_panchayat_remitted || 0)}`;
  }
}

function getPortalBadge(portalName) {
  const p = (portalName || '').toLowerCase();
  if (p.includes('anyror')) {
    return `<span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:5px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:var(--revenue); font-size:0.65rem; font-weight:800; font-family:var(--font-mono); flex-shrink:0;">7/12</span>`;
  }
  if (p.includes('digital gujarat')) {
    return `<span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:5px; background:rgba(234,88,12,0.15); border:1px solid rgba(234,88,12,0.3); color:var(--accent-light); font-size:0.65rem; font-weight:800; font-family:var(--font-mono); flex-shrink:0;">DG</span>`;
  }
  if (p.includes('csc')) {
    return `<span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:4px; background:rgba(113,113,122,0.15); border:1px solid rgba(113,113,122,0.3); color:var(--text-main); font-size:0.65rem; font-weight:700; font-family:var(--font-mono); flex-shrink:0;">CSC</span>`;
  }
  return `<span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:5px; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:var(--gov-mandate); font-size:0.75rem; flex-shrink:0;">⚡</span>`;
}

function renderPortalWallets(wallets, totalBalance) {
  const container = document.getElementById('container-portal-wallets');
  const totalBadge = document.getElementById('val-total-wallets');
  if (totalBadge) totalBadge.textContent = `Total: ${formatINR(totalBalance || 0)}`;

  if (!container) return;
  if (!wallets || wallets.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:1.25rem;">No portal wallets configured</div>';
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      ${wallets.map(w => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            ${getPortalBadge(w.portal_name)}
            <div>
              <div style="font-weight:600; font-size:0.875rem; display:flex; align-items:center; gap:0.45rem;">
                <span style="color:var(--text-main);">${escapeHtml(w.portal_name)}</span>
                ${w.is_low_balance ? '<span class="badge badge-cancelled" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Low Balance</span>' : ''}
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Min Alert: ${formatINR(w.min_alert_balance)}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.85rem;">
            <span class="font-tabular" style="font-weight:700; font-size:1rem; color:${w.is_low_balance ? 'var(--expense)' : 'var(--revenue)'};">
              ${formatINR(w.current_balance)}
            </span>
            <button class="btn btn-outline btn-sm btn-recharge-wallet" data-id="${w.id}" data-name="${escapeHtml(w.portal_name)}" style="padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:600;">
              Top-up
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.btn-recharge-wallet').forEach(btn => {
    btn.addEventListener('click', () => {
      openWalletTopupModal(btn.dataset.id, btn.dataset.name);
    });
  });
}

function renderPendingDeptOrders(orders, totalPending) {
  const container = document.getElementById('container-dept-claims-quick');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:1rem;">No pending department tasks</div>';
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.65rem;">
      ${orders.map(o => {
        const target = o.target_units || 0;
        const completed = o.completed_units || 0;
        const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 100;
        return `
          <div style="padding:0.5rem 0; border-bottom:1px solid var(--border-subtle);">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
              <span style="font-weight:600; color:var(--text-main);">${escapeHtml(o.scheme_name)}</span>
              <span class="font-tabular" style="font-weight:700; color:#f59e0b;">${formatINR(o.pending_claim_amount)} pending</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-dim); margin-bottom:0.35rem;">
              <span>${escapeHtml(o.dept_name)}</span>
              <span>${completed}/${target} units (${pct}%)</span>
            </div>
            <div style="width:100%; height:4px; background:var(--border-default); border-radius:2px; overflow:hidden;">
              <div class="dept-progress-bar" data-pct="${pct}" style="width:0%; height:100%; background:#f59e0b;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.dept-progress-bar').forEach(bar => {
    animateProgressBar(bar, parseFloat(bar.dataset.pct || 0));
  });
}

function renderTrendBars(trendPoints) {
  const chartEl = document.getElementById('trend-bar-chart');
  const datesEl = document.getElementById('trend-bar-dates');
  if (!chartEl) return;
  if (!trendPoints || trendPoints.length === 0) {
    chartEl.innerHTML = '<p style="color:var(--text-muted); padding:1rem; text-align:center; width:100%;">No trend data available</p>';
    if (datesEl) datesEl.innerHTML = '';
    return;
  }

  let maxVal = 5000;
  trendPoints.forEach(p => {
    if (p.revenue > maxVal) maxVal = p.revenue;
    if (p.expenses > maxVal) maxVal = p.expenses;
  });

  chartEl.innerHTML = trendPoints.map(p => {
    const revH = p.revenue > 0 ? Math.max(6, Math.round((p.revenue / maxVal) * 150)) : 2;
    const expH = p.expenses > 0 ? Math.max(6, Math.round((p.expenses / maxVal) * 150)) : 2;
    const revFormatted = formatINR(p.revenue);
    const expFormatted = formatINR(p.expenses);
    const d = new Date(p.date);
    const dateLabel = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : p.date.slice(5);

    return `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;" title="${dateLabel}&#10;Inflow (આવક): ${revFormatted}&#10;Outflow (જાવક): ${expFormatted}">
        <div style="display:flex; gap:4px; align-items:flex-end; height:160px; width:100%; justify-content:center;">
          <div class="trend-bar-animated" style="width:14px; max-width:42%; height:${revH}px; background:var(--revenue); border-radius:2px 2px 0 0;"></div>
          <div class="trend-bar-animated" style="width:14px; max-width:42%; height:${expH}px; background:var(--expense); border-radius:2px 2px 0 0;"></div>
        </div>
      </div>
    `;
  }).join('');

  if (datesEl) {
    datesEl.innerHTML = trendPoints.map(p => {
      const d = new Date(p.date);
      const dateLabel = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : p.date.slice(5);
      return `<div style="flex:1; text-align:center; font-size:0.7rem; color:var(--text-muted); font-weight:500;">${dateLabel}</div>`;
    }).join('');
  }
}

function renderExpenseBreakdown(categories) {
  const container = document.getElementById('expense-breakdown-list');
  if (!container) return;
  if (!categories || categories.length === 0) {
    container.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:1.5rem;">No expenses recorded</div>';
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      ${categories.map(cat => `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
            <span>${escapeHtml(cat.label)}</span>
            <span class="font-tabular" style="font-weight:600;">${formatINR(cat.amount)} <span style="color:var(--text-dim); font-size:0.75rem;">(${cat.percentage}%)</span></span>
          </div>
          <div style="width:100%; height:5px; background:var(--border-default); border-radius:3px; overflow:hidden;">
            <div class="expense-progress-bar" data-pct="${cat.percentage}" style="width:0%; height:100%; background:#ef4444;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.expense-progress-bar').forEach(bar => {
    animateProgressBar(bar, parseFloat(bar.dataset.pct || 0));
  });
}

function renderTodayWorkTable(workList) {
  const tbody = document.getElementById('tbody-today-work');
  const mobileList = document.getElementById('mobile-today-work-list');
  const badge = document.getElementById('today-work-badge');
  if (badge) badge.textContent = `${(workList || []).length} records`;

  if (!workList || workList.length === 0) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-dim); padding:2rem;">No applications recorded today</td></tr>';
    if (mobileList) mobileList.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1.5rem 1rem; font-size:0.85rem;">No applications recorded today</div>';
    return;
  }

  if (tbody) {
    tbody.innerHTML = workList.map(w => {
      let statusClass = 'badge-waiting';
      if (w.status === 'Ready / Printed') statusClass = 'badge-planned';
      else if (w.status === 'Completed / Delivered' || w.status === 'Completed') statusClass = 'badge-completed';
      else if (w.status === 'In Progress') statusClass = 'badge-in-progress';
      else if (w.status && (w.status.includes('Cancelled') || w.status.includes('Rejected'))) statusClass = 'badge-cancelled';

      const token = w.token_no || `TK-${w.id}`;
      const pending = Math.max(0, (w.agreed_amount || 0) - (w.received_amount || 0));

      return `
        <tr>
          <td style="white-space:nowrap;"><span class="token-pill">${escapeHtml(token)}</span></td>
          <td style="font-weight:600; font-family:var(--font-gujarati), var(--font-sans);">${escapeHtml(w.person_name || 'Citizen')}</td>
          <td>
            <div style="font-weight:600; font-size:0.835rem;">${escapeHtml(w.title)}</div>
            <div style="font-size:0.725rem; color:var(--text-dim); margin-top:0.15rem;">${escapeHtml(w.service_category || w.category || '')}</div>
          </td>
          <td><span class="portal-tag">${escapeHtml(w.portal_name || 'General')}</span></td>
          <td style="white-space:nowrap;"><span class="badge ${statusClass}">${escapeHtml(w.status)}</span></td>
          <td style="text-align:right; font-weight:600; color:var(--text-main); white-space:nowrap;" class="font-tabular">${formatINR(w.agreed_amount)}</td>
          <td style="text-align:right; font-weight:700; color:${pending > 0 ? '#ef4444' : '#10b981'}; white-space:nowrap;" class="font-tabular">
            ${formatINR(pending)}
          </td>
        </tr>
      `;
    }).join('');
  }

  if (mobileList) {
    mobileList.innerHTML = workList.map(w => {
      const statusClass = `badge-${w.status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const token = w.token_no || `TK-${w.id}`;
      const fee = w.agreed_amount || 0;
      const received = w.received_amount || 0;
      const pending = Math.max(0, fee - received);

      return `
        <div class="mobile-card">
          <div class="mobile-card-header">
            <div class="mobile-card-title-group">
              <span style="font-family:var(--font-mono); font-weight:700; color:var(--accent-light); font-size:0.825rem;">${escapeHtml(token)}</span>
              <div class="mobile-card-title">${escapeHtml(w.person_name || 'Walk-in Citizen')}</div>
            </div>
            <span class="badge ${statusClass}">${escapeHtml(w.status)}</span>
          </div>
          <div class="mobile-card-body">
            <div style="font-weight:600; color:var(--text-main); font-size:0.85rem;">${escapeHtml(w.title)}</div>
            <div class="mobile-card-subtitle">
              <span>${escapeHtml(w.service_category || w.category || 'General')}</span>
              ${w.portal_name ? `<span>&bull;</span><span style="color:#f59e0b; font-weight:600;">${escapeHtml(w.portal_name)}</span>` : ''}
            </div>
            <div class="mobile-card-metric-row">
              <div>
                <div class="mobile-card-metric-label">Total Fee</div>
                <div class="mobile-card-metric-val">${formatINR(fee)}</div>
              </div>
              <div>
                <div class="mobile-card-metric-label">Received</div>
                <div class="mobile-card-metric-val" style="color:var(--revenue);">${formatINR(received)}</div>
              </div>
              <div>
                <div class="mobile-card-metric-label">Pending</div>
                <div class="mobile-card-metric-val" style="${pending > 0 ? 'color:var(--expense);' : 'color:var(--revenue);'}">${formatINR(pending)}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function openWalletTopupModal(walletId, walletName) {
  let modalContainer = document.getElementById('dynamic-page-modal');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'dynamic-page-modal';
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <div class="modal-backdrop open" id="modal-topup-wallet">
      <div class="modal-dialog" style="max-width:440px;">
        <div class="modal-header">
          <h3 class="modal-title">Wallet Recharge / Top-up</h3>
          <button class="modal-close" id="btn-modal-close" aria-label="Close">&times;</button>
        </div>
        <form id="wallet-topup-form">
          <div class="modal-body">
            <div style="font-size:0.9rem; font-weight:700; color:#f97316; margin-bottom:1rem;">${escapeHtml(walletName)}</div>
            <div class="form-group">
              <label class="form-label">Top-up Amount (₹) *</label>
              <input type="number" id="input-topup-amt" class="form-control" min="1" step="1" placeholder="e.g. 500" required />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select id="input-topup-method" class="form-select">
                <option value="UPI" selected>UPI / PhonePe / GPay</option>
                <option value="Bank Transfer">Net Banking (IMPS/NEFT)</option>
                <option value="Debit Card">Debit Card</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Bank Reference / UTR No.</label>
              <input type="text" id="input-topup-ref" class="form-control" placeholder="UPI Reference No." />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background:#f97316; border:none; font-weight:700;">Confirm Top-up</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-topup-wallet')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-topup-wallet') closeModal();
  });

  document.getElementById('wallet-topup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amtRupees = document.getElementById('input-topup-amt').value;
    const ref = document.getElementById('input-topup-ref').value;
    const method = document.getElementById('input-topup-method').value;

    try {
      await vceApi.topupWallet(walletId, {
        amount: rupeesToPaise(amtRupees),
        reference_no: ref,
        payment_method: method
      });
      closeModal();
      loadDashboard();
    } catch (err) {
      alert('Failed to top-up wallet: ' + err.message);
    }
  });
}

function closeModal() {
  const modalContainer = document.getElementById('dynamic-page-modal');
  if (modalContainer) modalContainer.innerHTML = '';
  document.body.style.overflow = '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Preset Filter Handlers
document.getElementById('dash-preset-select')?.addEventListener('change', (e) => {
  currentPreset = e.target.value;
  const customBox = document.getElementById('custom-range-inputs');
  if (currentPreset === 'custom') {
    customBox.style.display = 'flex';
  } else {
    customBox.style.display = 'none';
    loadDashboard();
  }
});

document.getElementById('btn-apply-custom')?.addEventListener('click', () => {
  customStart = document.getElementById('dash-date-start').value;
  customEnd = document.getElementById('dash-date-end').value;
  loadDashboard();
});

// Quick Action Buttons
document.getElementById('btn-quick-new-app')?.addEventListener('click', () => {
  window.location.href = '/pages/work.html?action=new';
});

document.getElementById('btn-quick-712')?.addEventListener('click', () => {
  window.location.href = '/pages/work.html?service=anyror-7-12';
});

document.getElementById('btn-quick-recharge')?.addEventListener('click', async () => {
  try {
    const wallets = await vceApi.getWallets();
    if (wallets.length > 0) {
      openWalletTopupModal(wallets[0].id, wallets[0].portal_name);
    }
  } catch (err) {
    console.error(err);
  }
});

window.addEventListener('vce:refresh', () => loadDashboard());
document.addEventListener('DOMContentLoaded', () => loadDashboard());
