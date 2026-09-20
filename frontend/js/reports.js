/**
 * Reports & Export Controller
 */
import { api, vceApi, formatINR, formatDate, paiseToRupees } from './api.js';
import { notify } from '../components/notification.js';

let currentReportData = null;

async function loadProfile() {
  try {
    const profile = await vceApi.getProfile();
    const metaCenter = document.getElementById('print-report-meta-center');
    const metaVce = document.getElementById('print-report-meta-vce');
    if (metaCenter && profile) {
      metaCenter.textContent = `Gram Panchayat: ${profile.gram_panchayat || '—'} | Taluka: ${profile.taluka || '—'} | District: ${profile.district || '—'}`;
    }
    if (metaVce && profile) {
      metaVce.textContent = `Center ID: ${profile.center_id || '—'} | VCE: ${profile.vce_name || '—'} | Talati: ${profile.talati_name || '—'}`;
    }
  } catch (err) {
    console.warn('Could not load profile for print header:', err);
  }
}

async function loadReport() {
  const typeEl = document.getElementById('report-type-select');
  const presetEl = document.getElementById('report-preset-select');
  if (!typeEl || !presetEl) return;

  const type = typeEl.value;
  const preset = presetEl.value;
  const startDate = document.getElementById('report-date-start')?.value || undefined;
  const endDate = document.getElementById('report-date-end')?.value || undefined;

  // Sync print header text
  const printTitle = document.getElementById('print-statement-title');
  const printPeriod = document.getElementById('print-statement-period');
  const selectedTypeOpt = typeEl.options[typeEl.selectedIndex];
  const selectedPresetOpt = presetEl.options[presetEl.selectedIndex];

  if (printTitle && selectedTypeOpt) {
    printTitle.textContent = selectedTypeOpt.text.split('(')[0].trim();
  }
  if (printPeriod && selectedPresetOpt) {
    printPeriod.textContent = `Period: ${selectedPresetOpt.text}`;
  }

  try {
    const data = await api.get('/reports', {
      type,
      preset,
      start_date: preset === 'custom' ? startDate : undefined,
      end_date: preset === 'custom' ? endDate : undefined
    });

    currentReportData = data;
    renderReport(data);
  } catch (err) {
    console.error(err);
    notify.error('Failed to generate report');
  }
}

function renderReport(data) {
  const thead = document.getElementById('report-table-head');
  const tbody = document.getElementById('report-table-body');
  const title = document.getElementById('report-view-title');
  const totalBadge = document.getElementById('report-total-badge');
  const mobCardList = document.getElementById('mobile-report-card-list');

  title.textContent = data.title;
  if (data.total_amount !== undefined) {
    totalBadge.style.display = 'inline-block';
    totalBadge.textContent = `Total: ${formatINR(data.total_amount)}`;
  } else if (data.profit !== undefined) {
    totalBadge.style.display = 'inline-block';
    totalBadge.textContent = `Net Profit: ${formatINR(data.profit)}`;
  } else {
    totalBadge.style.display = 'none';
  }

  const rows = data.rows || [];
  renderMobileCards(data, rows, mobCardList);

  if (data.report_type === 'profit') {
    thead.innerHTML = `
      <tr>
        <th>Financial Metric</th>
        <th style="text-align:right;">Amount (₹)</th>
      </tr>
    `;
    tbody.innerHTML = `
      <tr>
        <td style="font-weight:600;">Total Revenue Received</td>
        <td class="font-tabular" style="text-align:right; color:var(--revenue); font-weight:700;">+${formatINR(data.revenue)}</td>
      </tr>
      <tr>
        <td style="font-weight:600;">Total Center Expenses</td>
        <td class="font-tabular" style="text-align:right; color:var(--expense); font-weight:700;">-${formatINR(data.expenses)}</td>
      </tr>
      <tr style="background-color:var(--bg-surface-elevated); font-size:1rem;">
        <td style="font-weight:700;">Net Cash Profit</td>
        <td class="font-tabular" style="text-align:right; color:var(--accent); font-weight:800;">${formatINR(data.profit)}</td>
      </tr>
    `;
    return;
  }

  if (data.report_type === 'balance_sheet') {
    if (totalBadge) {
      totalBadge.style.display = 'inline-block';
      totalBadge.innerHTML = `Assets: <b>${formatINR(data.total_assets)}</b> &bull; Net Worth: <b>${formatINR(data.equity)}</b>`;
    }
    thead.innerHTML = `
      <tr>
        <th style="width:220px;">Classification</th>
        <th>Balance Sheet Component / Account</th>
        <th style="text-align:right;">Amount (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => {
      let badgeClass = 'badge-waiting';
      let amountColor = 'var(--text-main)';
      let rowBg = '';
      if (r.category === 'Current Assets') {
        badgeClass = 'badge-completed';
        amountColor = 'var(--revenue)';
      } else if (r.category === 'Current Liabilities') {
        badgeClass = 'badge-delayed';
        amountColor = 'var(--expense)';
      } else if (r.category === 'Proprietor Equity') {
        badgeClass = 'badge-in-progress';
        amountColor = 'var(--accent)';
        rowBg = 'background-color:var(--bg-surface-elevated); font-weight:700;';
      }
      return `
        <tr style="${rowBg}">
          <td><span class="badge ${badgeClass}">${r.category}</span></td>
          <td style="font-weight:600;">${r.item}</td>
          <td class="font-tabular" style="text-align:right; font-weight:700; color:${amountColor};">${formatINR(r.amount)}</td>
        </tr>
      `;
    }).join('') + `
      <tr style="background:var(--bg-surface); font-weight:800; border-top:2px solid var(--border-default);">
        <td colspan="2" style="font-size:0.95rem;">TOTAL ASSETS (કુલ અસ્કયામતો)</td>
        <td class="font-tabular" style="text-align:right; color:var(--revenue); font-size:1rem;">${formatINR(data.total_assets)}</td>
      </tr>
      <tr style="background:var(--bg-surface); font-weight:800;">
        <td colspan="2" style="font-size:0.95rem;">TOTAL LIABILITIES + PROPRIETOR NET WORTH</td>
        <td class="font-tabular" style="text-align:right; color:var(--accent); font-size:1rem;">${formatINR(data.total_liabilities + data.equity)}</td>
      </tr>
    `;
    return;
  }

  if (data.report_type === 'accrual_pnl') {
    if (totalBadge) {
      totalBadge.style.display = 'inline-block';
      totalBadge.innerHTML = `Operating Turnover: <b>${formatINR(data.total_revenue)}</b> &bull; Net Profit: <b>${formatINR(data.net_profit)}</b>`;
    }
    thead.innerHTML = `
      <tr>
        <th style="width:220px;">Accounting Classification</th>
        <th>Revenue / Expense Line Item</th>
        <th style="text-align:right;">Amount (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => {
      let badgeClass = 'badge-waiting';
      let color = 'var(--text-main)';
      let rowStyle = '';
      if (r.component === 'Operating Revenue') {
        badgeClass = 'badge-completed';
        color = 'var(--revenue)';
      } else if (r.component === 'Operating Expense') {
        badgeClass = 'badge-delayed';
        color = 'var(--expense)';
      } else if (r.component === 'Net Operating Surplus') {
        badgeClass = 'badge-in-progress';
        color = 'var(--accent)';
        rowStyle = 'background-color:var(--bg-surface-elevated); font-weight:700; font-size:1rem;';
      } else if (r.component === 'Income Tax Guidance') {
        badgeClass = 'badge-planned';
        color = '#f59e0b';
        rowStyle = 'background-color:rgba(245, 158, 11, 0.08); font-weight:600;';
      }
      return `
        <tr style="${rowStyle}">
          <td><span class="badge ${badgeClass}">${r.component}</span></td>
          <td style="font-weight:600;">${r.detail}</td>
          <td class="font-tabular" style="text-align:right; font-weight:700; color:${color};">${formatINR(r.amount)}</td>
        </tr>
      `;
    }).join('');
    return;
  }

  if (data.report_type === 'dept_claims') {
    if (totalBadge) {
      totalBadge.style.display = 'inline-block';
      totalBadge.innerHTML = `Claims: <b>${formatINR(data.total_amount)}</b> &bull; Disbursed: <b>${formatINR(data.total_received)}</b> &bull; Pending: <b>${formatINR(data.total_pending)}</b>`;
    }
    thead.innerHTML = `
      <tr>
        <th>Department & Scheme</th>
        <th>Order Ref</th>
        <th style="text-align:center;">Units Done</th>
        <th style="text-align:right;">Rate (₹)</th>
        <th style="text-align:right;">Total Claim (₹)</th>
        <th style="text-align:right;">Disbursed (₹)</th>
        <th style="text-align:right;">Pending (₹)</th>
        <th>Status</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>
          <div style="font-weight:600;">${r.scheme_name}</div>
          <div style="font-size:0.75rem; color:#f59e0b; font-weight:600;">${r.dept_name}</div>
        </td>
        <td style="color:var(--text-dim); font-size:0.8rem;">${r.order_ref || '-'}</td>
        <td style="text-align:center;">${r.completed_units} / ${r.target_units || '-'}</td>
        <td class="font-tabular" style="text-align:right;">${formatINR(r.unit_rate)}</td>
        <td class="font-tabular" style="text-align:right; font-weight:700; color:var(--revenue);">${formatINR(r.total_claim_amount)}</td>
        <td class="font-tabular" style="text-align:right;">${formatINR(r.amount_received)}</td>
        <td class="font-tabular" style="text-align:right; font-weight:700; color:${r.pending_amount > 0 ? 'var(--pending)' : 'var(--revenue)'};">${formatINR(r.pending_amount)}</td>
        <td><span class="badge ${r.claim_status === 'Disbursed' ? 'badge-completed' : 'badge-waiting'}">${r.claim_status}</span></td>
      </tr>
    `).join('');
    return;
  }

  if (data.report_type === 'panchayat_share') {
    if (totalBadge) {
      totalBadge.style.display = 'inline-block';
      totalBadge.textContent = `Total GP Share: ${formatINR(data.total_amount)}`;
    }
    thead.innerHTML = `
      <tr>
        <th>Date</th>
        <th>Application / Service</th>
        <th>Citizen</th>
        <th>Category</th>
        <th style="text-align:right;">Agreed Fee (₹)</th>
        <th style="text-align:right;">Portal Cost (₹)</th>
        <th style="text-align:right;">GP Share (₹)</th>
        <th style="text-align:right;">VCE Share (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${formatDate(r.created_at)}</td>
        <td style="font-weight:600;">${r.title}</td>
        <td>${r.person_name}</td>
        <td><span class="badge badge-waiting">${r.service_category || 'e-Gram'}</span></td>
        <td class="font-tabular" style="text-align:right;">${formatINR(r.agreed_amount)}</td>
        <td class="font-tabular" style="text-align:right; color:var(--expense);">${formatINR(r.portal_cost)}</td>
        <td class="font-tabular" style="text-align:right; font-weight:700; color:var(--pending);">${formatINR(r.panchayat_share)}</td>
        <td class="font-tabular" style="text-align:right; font-weight:700; color:var(--revenue);">${formatINR(r.vce_commission)}</td>
      </tr>
    `).join('');
    return;
  }

  if (rows.length === 0) {
    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-dim);">No records found for the selected filter.</td></tr>';
    return;
  }

  if (data.report_type === 'revenue') {
    thead.innerHTML = `
      <tr>
        <th>Date & Time</th>
        <th>Citizen Name</th>
        <th>Service / Application</th>
        <th>Payment Method</th>
        <th>Reference</th>
        <th style="text-align:right;">Amount (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${formatDate(r.payment_date)} <span style="color:var(--text-dim); font-size:0.75rem;">${r.payment_time}</span></td>
        <td style="font-weight:600;">${r.person_name}</td>
        <td style="color:var(--text-muted); font-size:0.85rem;">${r.work_title || 'General Fee'}</td>
        <td><span class="badge badge-${r.payment_method.toLowerCase()}">${r.payment_method}</span></td>
        <td style="color:var(--text-dim); font-size:0.8rem;">${r.transaction_reference || '-'}</td>
        <td class="font-tabular" style="text-align:right; color:var(--revenue); font-weight:700;">+${formatINR(r.amount)}</td>
      </tr>
    `).join('');
  } else if (data.report_type === 'expense') {
    thead.innerHTML = `
      <tr>
        <th>Date & Time</th>
        <th>Expense Item</th>
        <th>Category</th>
        <th>Vendor / Payee</th>
        <th>Method</th>
        <th style="text-align:right;">Amount (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${formatDate(r.expense_date)} <span style="color:var(--text-dim); font-size:0.75rem;">${r.expense_time}</span></td>
        <td style="font-weight:600;">${r.title}</td>
        <td><span class="badge badge-waiting">${r.category_name || 'General'}</span></td>
        <td>${r.vendor || '-'}</td>
        <td><span class="badge badge-${r.payment_method.toLowerCase()}">${r.payment_method}</span></td>
        <td class="font-tabular" style="text-align:right; color:var(--expense); font-weight:700;">-${formatINR(r.amount)}</td>
      </tr>
    `).join('');
  } else if (data.report_type === 'person_wise') {
    thead.innerHTML = `
      <tr>
        <th>Citizen Name</th>
        <th>Phone</th>
        <th style="text-align:center;">Applications Count</th>
        <th style="text-align:right;">Agreed Fee (₹)</th>
        <th style="text-align:right;">Received (₹)</th>
        <th style="text-align:right;">Udhar Pending (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight:600;">${r.name} <span style="color:var(--text-dim); font-size:0.75rem;">${r.company ? `(${r.company})` : ''}</span></td>
        <td>${r.phone || '-'}</td>
        <td style="text-align:center;"><span class="badge badge-waiting">${r.work_count}</span></td>
        <td class="font-tabular" style="text-align:right;">${formatINR(r.total_agreed)}</td>
        <td class="font-tabular" style="text-align:right; color:var(--revenue);">${formatINR(r.total_received)}</td>
        <td class="font-tabular" style="text-align:right; color:var(--pending); font-weight:700;">${formatINR(r.total_pending)}</td>
      </tr>
    `).join('');
  } else if (data.report_type === 'work_wise') {
    thead.innerHTML = `
      <tr>
        <th>Service / Application</th>
        <th>Citizen Name</th>
        <th>Category</th>
        <th>Deadline</th>
        <th style="text-align:right;">Agreed (₹)</th>
        <th style="text-align:right;">Received (₹)</th>
        <th style="text-align:right;">Pending (₹)</th>
        <th>Status</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight:600;">${r.title}</td>
        <td>${r.person_name}</td>
        <td><span class="badge badge-waiting">${r.category}</span></td>
        <td style="font-size:0.8rem; color:var(--text-dim);">${formatDate(r.deadline) || '-'}</td>
        <td class="font-tabular" style="text-align:right;">${formatINR(r.agreed_amount)}</td>
        <td class="font-tabular" style="text-align:right; color:var(--revenue);">${formatINR(r.received_amount)}</td>
        <td class="font-tabular" style="text-align:right; color:var(--pending); font-weight:700;">${formatINR(r.pending_amount)}</td>
        <td><span class="badge ${r.status.startsWith('Completed') ? 'badge-completed' : 'badge-in-progress'}">${r.status}</span></td>
      </tr>
    `).join('');
  } else if (data.report_type === 'outstanding') {
    thead.innerHTML = `
      <tr>
        <th>Service / Application</th>
        <th>Citizen Name</th>
        <th>Phone</th>
        <th style="text-align:right;">Agreed Fee (₹)</th>
        <th style="text-align:right;">Received (₹)</th>
        <th style="text-align:right;">Udhar Pending (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight:600;">${r.title}</td>
        <td>${r.person_name}</td>
        <td>${r.person_phone || '-'}</td>
        <td class="font-tabular" style="text-align:right;">${formatINR(r.agreed_amount)}</td>
        <td class="font-tabular" style="text-align:right; color:var(--revenue);">${formatINR(r.received_amount)}</td>
        <td class="font-tabular" style="text-align:right; color:var(--pending); font-weight:800;">${formatINR(r.pending_amount)}</td>
      </tr>
    `).join('');
  } else {
    thead.innerHTML = `
      <tr>
        <th>Payment Method</th>
        <th style="text-align:center;">Transactions Count</th>
        <th style="text-align:right;">Total Amount (₹)</th>
      </tr>
    `;
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight:600;"><span class="badge badge-${r.payment_method.toLowerCase()}">${r.payment_method}</span></td>
        <td style="text-align:center;">${r.transaction_count}</td>
        <td class="font-tabular" style="text-align:right; font-weight:700; color:var(--revenue);">${formatINR(r.total_amount)}</td>
      </tr>
    `).join('');
  }
}

function triggerDownload(format) {
  const type = document.getElementById('report-type-select')?.value || 'revenue';
  const preset = document.getElementById('report-preset-select')?.value || 'this_month';
  const startDate = document.getElementById('report-date-start')?.value || '';
  const endDate = document.getElementById('report-date-end')?.value || '';

  let url = `/api/reports/export?type=${type}&format=${format}&preset=${preset}`;
  if (preset === 'custom' && startDate && endDate) {
    url += `&start_date=${startDate}&end_date=${endDate}`;
  }

  notify.info(`Generating ${format.toUpperCase()} export...`);

  // Safe programmatic anchor click — immune to browser popup blockers
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}_report_${preset}.${format === 'excel' ? 'xlsx' : format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function renderMobileCards(data, rows, container) {
  if (!container) return;
  if (!rows || rows.length === 0) {
    if (data.report_type === 'profit') {
      container.innerHTML = `
        <div class="report-mobile-card">
          <div class="report-mobile-card-header">
            <span class="report-mobile-card-title">Total Revenue Received</span>
            <span class="report-mobile-card-amount" style="color:var(--revenue);">+${formatINR(data.revenue)}</span>
          </div>
          <div class="report-mobile-card-header">
            <span class="report-mobile-card-title">Total Center Expenses</span>
            <span class="report-mobile-card-amount" style="color:var(--expense);">-${formatINR(data.expenses)}</span>
          </div>
          <div class="report-mobile-card-header" style="background:var(--bg-surface-elevated); padding:0.6rem; border-radius:4px; margin-top:0.35rem;">
            <span class="report-mobile-card-title" style="font-weight:800;">Net Cash Profit</span>
            <span class="report-mobile-card-amount" style="color:var(--accent); font-size:1.1rem; font-weight:800;">${formatINR(data.profit)}</span>
          </div>
        </div>
      `;
      return;
    }
    container.innerHTML = `<div style="text-align:center; padding:2rem 1rem; color:var(--text-dim); font-size:0.85rem;">No records found for selected statement filter.</div>`;
    return;
  }

  if (data.report_type === 'revenue') {
    container.innerHTML = rows.map(r => `
      <div class="report-mobile-card">
        <div class="report-mobile-card-header">
          <div>
            <div class="report-mobile-card-title">${escapeHtml(r.person_name || 'Citizen')}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.1rem;">${escapeHtml(r.work_title || 'Service Fee')}</div>
          </div>
          <div class="report-mobile-card-amount" style="color:var(--revenue);">+${formatINR(r.amount)}</div>
        </div>
        <div class="report-mobile-card-row">
          <span>${formatDate(r.payment_date)} ${r.payment_time ? `&bull; ${r.payment_time}` : ''}</span>
          <span class="badge badge-${(r.payment_method || '').toLowerCase()}">${escapeHtml(r.payment_method)}</span>
        </div>
      </div>
    `).join('');
  } else if (data.report_type === 'expense') {
    container.innerHTML = rows.map(r => `
      <div class="report-mobile-card">
        <div class="report-mobile-card-header">
          <div>
            <div class="report-mobile-card-title">${escapeHtml(r.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.1rem;">${escapeHtml(r.vendor || 'General Vendor')}</div>
          </div>
          <div class="report-mobile-card-amount" style="color:var(--expense);">-${formatINR(r.amount)}</div>
        </div>
        <div class="report-mobile-card-row">
          <span>${formatDate(r.expense_date)} ${r.expense_time ? `&bull; ${r.expense_time}` : ''}</span>
          <span class="badge badge-waiting">${escapeHtml(r.category_name || 'Expense')}</span>
        </div>
      </div>
    `).join('');
  } else if (data.report_type === 'dept_claims') {
    container.innerHTML = rows.map(r => `
      <div class="report-mobile-card">
        <div class="report-mobile-card-header">
          <div>
            <div class="report-mobile-card-title">${escapeHtml(r.scheme_name)}</div>
            <div style="font-size:0.75rem; color:var(--pending); font-weight:600;">${escapeHtml(r.dept_name)}</div>
          </div>
          <span class="badge ${r.claim_status === 'Disbursed' ? 'badge-completed' : 'badge-waiting'}">${escapeHtml(r.claim_status)}</span>
        </div>
        <div class="report-mobile-card-row">
          <span>Units Done: <b>${r.completed_units}</b> @ ${formatINR(r.unit_rate)}</span>
          <span style="font-weight:700; color:var(--revenue);">${formatINR(r.total_claim_amount)}</span>
        </div>
        <div class="report-mobile-card-row" style="border-top:1px solid var(--border-subtle); padding-top:0.35rem; margin-top:0.2rem;">
          <span>Received: ${formatINR(r.amount_received)}</span>
          <span style="color:${r.pending_amount > 0 ? 'var(--pending)' : 'var(--revenue)'}; font-weight:700;">Pending: ${formatINR(r.pending_amount)}</span>
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = rows.map(r => `
      <div class="report-mobile-card">
        <div class="report-mobile-card-header">
          <div class="report-mobile-card-title">${escapeHtml(r.title || r.item || r.name || r.detail || r.scheme_name || 'Line Item')}</div>
          ${r.amount !== undefined ? `<div class="report-mobile-card-amount">${formatINR(r.amount)}</div>` : ''}
        </div>
        <div class="report-mobile-card-row">
          <span>${escapeHtml(r.category || r.component || r.status || '')}</span>
          <span>${r.total_received !== undefined ? `Rec: ${formatINR(r.total_received)}` : ''}</span>
        </div>
      </div>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadReport();

  // Generate button
  document.getElementById('btn-generate-report')?.addEventListener('click', () => loadReport());

  // Auto-reload on Statement Type change
  document.getElementById('report-type-select')?.addEventListener('change', () => loadReport());

  // Auto-reload on Period change
  document.getElementById('report-preset-select')?.addEventListener('change', (e) => {
    const box = document.getElementById('report-custom-date-box');
    if (e.target.value === 'custom') {
      box.style.display = 'flex';
    } else {
      box.style.display = 'none';
      loadReport();
    }
  });

  // Custom date inputs
  document.getElementById('report-date-start')?.addEventListener('change', () => {
    const end = document.getElementById('report-date-end')?.value;
    if (end) loadReport();
  });
  document.getElementById('report-date-end')?.addEventListener('change', () => {
    const start = document.getElementById('report-date-start')?.value;
    if (start) loadReport();
  });

  // Exports
  document.getElementById('btn-export-csv')?.addEventListener('click', () => triggerDownload('csv'));
  document.getElementById('btn-export-excel')?.addEventListener('click', () => triggerDownload('excel'));
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => triggerDownload('pdf'));

  // Dedicated Print Statement button
  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    window.print();
  });
});
