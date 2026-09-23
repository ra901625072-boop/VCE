/**
 * Daily Rojmel Controller — VCE Pali e-Gram
 */
import { vceApi, formatINR, getTodayDateStr, rupeesToPaise } from './api.js';
import { notify } from '../components/notification.js';
import { auth } from './auth.js';

let currentDate = getTodayDateStr();
let currentRojmelData = null;

document.addEventListener('DOMContentLoaded', () => {
  initRojmel();
});

async function initRojmel() {
  const datePicker = document.getElementById('rojmel-date-picker');
  if (datePicker) {
    datePicker.value = currentDate;
    datePicker.addEventListener('change', (e) => {
      currentDate = e.target.value;
      loadRojmelData(currentDate);
    });
  }

  const printBtn = document.getElementById('btn-print-rojmel');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Setup Remittance and Day Close Modals (Desktop & Mobile)
  const remitBtn = document.getElementById('btn-open-remit-modal');
  if (remitBtn) remitBtn.addEventListener('click', openRemittanceModal);
  const mobileRemitBtn = document.getElementById('btn-mobile-remit');
  if (mobileRemitBtn) mobileRemitBtn.addEventListener('click', openRemittanceModal);

  const dayCloseBtn = document.getElementById('btn-open-day-close');
  if (dayCloseBtn) dayCloseBtn.addEventListener('click', openDayCloseModal);
  const mobileDayCloseBtn = document.getElementById('btn-mobile-close-day');
  if (mobileDayCloseBtn) mobileDayCloseBtn.addEventListener('click', openDayCloseModal);

  const mobilePrintBtn = document.getElementById('btn-mobile-print');
  if (mobilePrintBtn) mobilePrintBtn.addEventListener('click', () => window.print());

  // Mobile Segmented Switcher
  const tabAavak = document.getElementById('tab-btn-aavak');
  const tabJavak = document.getElementById('tab-btn-javak');
  const cardAavak = document.getElementById('card-aavak');
  const cardJavak = document.getElementById('card-javak');

  if (tabAavak && tabJavak && cardAavak && cardJavak) {
    tabAavak.addEventListener('click', () => {
      tabAavak.classList.add('active');
      tabJavak.classList.remove('active');
      cardAavak.classList.remove('mobile-hidden');
      cardJavak.classList.add('mobile-hidden');
    });

    tabJavak.addEventListener('click', () => {
      tabJavak.classList.add('active');
      tabAavak.classList.remove('active');
      cardJavak.classList.remove('mobile-hidden');
      cardAavak.classList.add('mobile-hidden');
    });

    // Default on mobile: show Aavak, hide Javak
    if (window.innerWidth <= 768) {
      cardAavak.classList.remove('mobile-hidden');
      cardJavak.classList.add('mobile-hidden');
    }
  }

  // Load Panchayat Profile Header
  loadProfileHeader();

  // Load Initial Rojmel Data
  loadRojmelData(currentDate);
}

async function loadProfileHeader() {
  try {
    const profile = await vceApi.getProfile();
    const headerEl = document.getElementById('rojmel-gp-header');
    if (headerEl && profile) {
      const parts = [];
      if (profile.taluka) parts.push(`Taluka: ${profile.taluka}`);
      if (profile.district) parts.push(`Dist: ${profile.district}`);
      if (profile.center_id) parts.push(`Center ID: ${profile.center_id}`);
      if (profile.vce_name) parts.push(`VCE: ${profile.vce_name}`);
      const gp = profile.gram_panchayat || 'Gram Panchayat';
      headerEl.textContent = parts.length > 0 ? `${gp} (${parts.join(', ')})` : `${gp} e-Gram Center`;
    }
    const printCenter = document.getElementById('print-meta-center');
    const printVce = document.getElementById('print-meta-vce');
    if (printCenter && profile) {
      printCenter.textContent = `Gram Panchayat: ${profile.gram_panchayat || '—'} | Taluka: ${profile.taluka || '—'} | District: ${profile.district || '—'}`;
    }
    if (printVce && profile) {
      printVce.textContent = `Center ID: ${profile.center_id || '—'} | VCE: ${profile.vce_name || '—'} | Talati: ${profile.talati_name || '—'}`;
    }
  } catch (err) {
    console.error('Failed to load profile header:', err);
  }
}

async function loadRojmelData(dateStr) {
  try {
    const printDate = document.getElementById('print-header-date');
    if (printDate) {
      printDate.textContent = `Date: ${dateStr}`;
    }

    const data = await vceApi.getRojmel(dateStr);
    currentRojmelData = data;
    renderRojmelSummary(data);
    renderLedgerTables(data.entries || []);
  } catch (err) {
    console.error('Failed to load rojmel data:', err);
    notify.error('Failed to load daily cash book');
  }
}

function renderRojmelSummary(data) {
  // Deficit Alert Banner
  const deficitBanner = document.getElementById('rojmel-deficit-banner');
  if (deficitBanner) {
    deficitBanner.style.display = data.is_cash_deficit ? 'flex' : 'none';
  }

  // Day Close / Lock Banner
  const lockBanner = document.getElementById('rojmel-lock-banner');
  const lockText = document.getElementById('lock-banner-text');
  const lockVariance = document.getElementById('lock-banner-variance');
  if (lockBanner) {
    if (data.day_close_info) {
      lockBanner.style.display = 'flex';
      const v = data.day_close_info.cash_variance;
      const vSign = v >= 0 ? '+' : '';
      if (lockText) lockText.textContent = `Daybook Closed & Verified by ${data.day_close_info.closed_by || 'VCE'}`;
      if (lockVariance) {
        lockVariance.textContent = `Physical Cash Variance: ${vSign}${formatINR(v)}`;
        lockVariance.className = v === 0 ? 'badge badge-completed' : (v > 0 ? 'badge badge-waiting' : 'badge badge-cancelled');
      }
    } else {
      lockBanner.style.display = 'none';
    }
  }

  // Opening
  const openCashEl = document.getElementById('val-open-cash');
  const openBankEl = document.getElementById('val-open-bank');
  if (openCashEl) openCashEl.textContent = formatINR(data.opening_cash || 0);
  if (openBankEl) openBankEl.textContent = formatINR(data.opening_bank || 0);

  // Aavak Totals
  const aavakTotal = data.total_aavak !== undefined ? data.total_aavak : (data.today_inflow || 0);
  const todayAavakEl = document.getElementById('val-today-aavak');
  const badgeAavak = document.getElementById('badge-total-aavak');
  const subAavakCash = document.getElementById('sub-aavak-cash');
  const subAavakUpi = document.getElementById('sub-aavak-upi');
  if (todayAavakEl) todayAavakEl.textContent = formatINR(aavakTotal);
  if (badgeAavak) badgeAavak.textContent = formatINR(aavakTotal);
  if (subAavakCash) subAavakCash.textContent = formatINR(data.today_citizen_cash || 0);
  if (subAavakUpi) subAavakUpi.textContent = formatINR((data.today_citizen_upi || 0) + (data.today_dept_received || 0));

  // Javak Totals
  const javakTotal = data.total_javak !== undefined ? data.total_javak : (data.today_outflow || 0);
  const todayJavakEl = document.getElementById('val-today-javak');
  const badgeJavak = document.getElementById('badge-total-javak');
  const subJavakCash = document.getElementById('sub-javak-cash');
  const subJavakUpi = document.getElementById('sub-javak-upi');
  if (todayJavakEl) todayJavakEl.textContent = formatINR(javakTotal);
  if (badgeJavak) badgeJavak.textContent = formatINR(javakTotal);
  const totalCashJavak = (data.today_expenses_cash || 0) + (data.today_wallet_recharges_cash || 0);
  const totalUpiJavak = (data.today_expenses_online || 0) + (data.today_wallet_recharges_online || 0) + (data.today_panchayat_remitted || 0);
  if (subJavakCash) subJavakCash.textContent = formatINR(totalCashJavak);
  if (subJavakUpi) subJavakUpi.textContent = formatINR(totalUpiJavak);

  // Closing Balance
  const closingCashEl = document.getElementById('val-closing-cash');
  const pillStatus = document.getElementById('pill-closing-status');
  const subClosingBank = document.getElementById('sub-closing-bank');
  if (subClosingBank) subClosingBank.textContent = formatINR(data.closing_bank || 0);
  if (closingCashEl) {
    closingCashEl.textContent = formatINR(data.closing_cash || 0);
    if (data.closing_cash < 0) {
      closingCashEl.style.color = '#ef4444';
      if (pillStatus) {
        pillStatus.textContent = 'Deficit (ખાધ)';
        pillStatus.className = 'stat-pill expense';
      }
    } else {
      closingCashEl.style.color = 'var(--text-main)';
      if (pillStatus) {
        pillStatus.textContent = 'Cash on Hand (આખર સિલક)';
        pillStatus.className = 'stat-pill profit';
      }
    }
  }

  // Summary Cards
  const udharGivenEl = document.getElementById('val-day-udhar-given');
  const udharRecEl = document.getElementById('val-day-udhar-recovered');
  const netProfitEl = document.getElementById('val-day-net-profit');
  const netCommEl = document.getElementById('val-day-net-comm');
  if (udharGivenEl) udharGivenEl.textContent = formatINR(data.today_udhar_given !== undefined ? data.today_udhar_given : (data.new_udhar_given || 0));
  if (udharRecEl) udharRecEl.textContent = formatINR(data.today_udhar_recovered !== undefined ? data.today_udhar_recovered : (data.old_udhar_recovered || 0));
  if (netProfitEl) netProfitEl.textContent = formatINR(data.today_net_earnings !== undefined ? data.today_net_earnings : (data.net_cash_surplus || 0));
  if (netCommEl) netCommEl.textContent = formatINR(data.net_commission_earned !== undefined ? data.net_commission_earned : (data.day_net_commission || 0));

  // Update mobile tab badges
  const mobAavak = document.getElementById('tab-val-aavak');
  const mobJavak = document.getElementById('tab-val-javak');
  if (mobAavak) mobAavak.textContent = formatINR(aavakTotal);
  if (mobJavak) mobJavak.textContent = formatINR(javakTotal);
}

function renderLedgerTables(entries) {
  const tbodyAavak = document.getElementById('tbody-aavak');
  const tbodyJavak = document.getElementById('tbody-javak');
  const mobileAavak = document.getElementById('mobile-aavak-list');
  const mobileJavak = document.getElementById('mobile-javak-list');

  const aavakRows = entries.filter(e => e.type === 'aavak');
  const javakRows = entries.filter(e => e.type === 'javak');

  if (tbodyAavak) {
    if (aavakRows.length === 0) {
      tbodyAavak.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:2rem;">No inflows recorded for this date</td></tr>`;
    } else {
      tbodyAavak.innerHTML = aavakRows.map(r => `
        <tr>
          <td style="font-size:0.775rem; color:var(--text-muted);">${r.time || '-'}</td>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${escapeHtml(r.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.category || '')}</div>
          </td>
          <td>
            <span class="badge ${r.method === 'Cash' ? 'badge-completed' : 'badge-planned'}">${escapeHtml(r.method)}</span>
          </td>
          <td style="text-align:right; font-weight:700; color:#10b981;" class="font-tabular">
            +${formatINR(r.amount)}
          </td>
        </tr>
      `).join('');
    }
  }

  if (mobileAavak) {
    if (aavakRows.length === 0) {
      mobileAavak.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:1.5rem; font-size:0.825rem;">No inflows recorded for this date</div>`;
    } else {
      mobileAavak.innerHTML = aavakRows.map(r => `
        <div class="mobile-card" style="padding:0.75rem 0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
            <div style="flex:1;">
              <div style="font-weight:600; color:var(--text-main); font-size:0.875rem;">${escapeHtml(r.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); display:flex; gap:0.4rem; align-items:center; margin-top:0.15rem;">
                <span style="display:inline-flex; align-items:center; gap:0.25rem;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${r.time || '-'}
                </span>
                ${r.category ? `<span>&bull;</span><span>${escapeHtml(r.category)}</span>` : ''}
              </div>
            </div>
            <div style="text-align:right;">
              <div class="font-tabular" style="font-size:1rem; font-weight:700; color:var(--revenue);">+${formatINR(r.amount)}</div>
              <span class="badge ${r.method === 'Cash' ? 'badge-completed' : 'badge-planned'}" style="font-size:0.65rem; margin-top:0.2rem;">${escapeHtml(r.method)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  if (tbodyJavak) {
    if (javakRows.length === 0) {
      tbodyJavak.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:2rem;">No outflows recorded for this date</td></tr>`;
    } else {
      tbodyJavak.innerHTML = javakRows.map(r => `
        <tr>
          <td style="font-size:0.775rem; color:var(--text-muted);">${r.time || '-'}</td>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${escapeHtml(r.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.category || '')}</div>
          </td>
          <td>
            <span class="badge ${r.method === 'Cash' ? 'badge-cancelled' : 'badge-waiting'}">${escapeHtml(r.method)}</span>
          </td>
          <td style="text-align:right; font-weight:700; color:#ef4444;" class="font-tabular">
            -${formatINR(r.amount)}
          </td>
        </tr>
      `).join('');
    }
  }

  if (mobileJavak) {
    if (javakRows.length === 0) {
      mobileJavak.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:1.5rem; font-size:0.825rem;">No outflows recorded for this date</div>`;
    } else {
      mobileJavak.innerHTML = javakRows.map(r => `
        <div class="mobile-card" style="padding:0.75rem 0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
            <div style="flex:1;">
              <div style="font-weight:600; color:var(--text-main); font-size:0.875rem;">${escapeHtml(r.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); display:flex; gap:0.4rem; align-items:center; margin-top:0.15rem;">
                <span style="display:inline-flex; align-items:center; gap:0.25rem;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${r.time || '-'}
                </span>
                ${r.category ? `<span>&bull;</span><span>${escapeHtml(r.category)}</span>` : ''}
              </div>
            </div>
            <div style="text-align:right;">
              <div class="font-tabular" style="font-size:1rem; font-weight:700; color:var(--expense);">-${formatINR(r.amount)}</div>
              <span class="badge ${r.method === 'Cash' ? 'badge-cancelled' : 'badge-waiting'}" style="font-size:0.65rem; margin-top:0.2rem;">${escapeHtml(r.method)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

// ---------------------------------------------------------------------------
// Gram Panchayat Remittance Modal
// ---------------------------------------------------------------------------
function openRemittanceModal() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-backdrop" id="modal-remit-backdrop">
      <div class="modal-dialog" style="max-width:480px;">
        <div class="modal-header">
          <h3 class="modal-title">Remit Royalty to Gram Panchayat</h3>
          <button type="button" class="btn-close" id="btn-close-remit">&times;</button>
        </div>
        <form id="form-remittance">
          <div class="modal-body" style="display:flex; flex-direction:column; gap:1rem;">
            <div>
              <label class="form-label">Remittance Amount (₹) *</label>
              <input type="number" step="0.01" min="1" id="remit-amount" class="form-control" placeholder="e.g. 2500" required />
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label class="form-label">Payment Mode *</label>
                <select id="remit-method" class="form-control">
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer / UPI</option>
                </select>
              </div>
              <div>
                <label class="form-label">Remittance Date *</label>
                <input type="date" id="remit-date" class="form-control" value="${currentDate}" required />
              </div>
            </div>
            <div>
              <label class="form-label">Talati Official Receipt Number *</label>
              <input type="text" id="remit-receipt-no" class="form-control" placeholder="e.g. GP-RCPT-2026-042" required />
            </div>
            <div>
              <label class="form-label">Settlement Period Notes</label>
              <input type="text" id="remit-notes" class="form-control" placeholder="e.g. Cleared royalty for Sep 1-15" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-remit">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Remittance Voucher</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-close-remit')?.addEventListener('click', closeRemittanceModal);
  document.getElementById('btn-cancel-remit')?.addEventListener('click', closeRemittanceModal);

  document.getElementById('form-remittance')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rupees = document.getElementById('remit-amount').value;
    const method = document.getElementById('remit-method').value;
    const date = document.getElementById('remit-date').value;
    const rcpt = document.getElementById('remit-receipt-no').value.trim();
    const notes = document.getElementById('remit-notes').value.trim();

    try {
      await vceApi.createRemittance({
        amount: rupeesToPaise(rupees),
        payment_method: method,
        remittance_date: date,
        talati_receipt_no: rcpt,
        notes: notes || undefined
      });
      notify.success('Panchayat remittance voucher recorded');
      closeRemittanceModal();
      loadRojmelData(currentDate);
    } catch (err) {
      console.error(err);
      notify.error('Failed to record remittance');
    }
  });
}

function closeRemittanceModal() {
  const backdrop = document.getElementById('modal-remit-backdrop');
  if (backdrop) backdrop.remove();
}

// ---------------------------------------------------------------------------
// Physical Cash Denomination & Day Close Modal
// ---------------------------------------------------------------------------
function openDayCloseModal() {
  const container = document.getElementById('modal-container');
  if (!container || !currentRojmelData) return;

  const systemCashPaise = currentRojmelData.closing_cash;

  container.innerHTML = `
    <div class="modal-backdrop" id="modal-close-backdrop">
      <div class="modal-dialog" style="max-width:540px;">
        <div class="modal-header">
          <h3 class="modal-title">Cash Drawer Reconciliation & Day Close</h3>
          <button type="button" class="btn-close" id="btn-close-daymodal">&times;</button>
        </div>
        <form id="form-day-close">
          <div class="modal-body" style="display:flex; flex-direction:column; gap:1rem;">
            <div style="background:var(--bg-subtle); padding:0.85rem 1rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.85rem; color:var(--text-muted);">System Expected Cash:</span>
              <span style="font-weight:700; font-size:1.1rem; color:var(--text-main);" class="font-tabular" id="dialog-system-cash">${formatINR(systemCashPaise)}</span>
            </div>

            <div>
              <label class="form-label" style="font-weight:600; margin-bottom:0.4rem; display:block;">Physical Cash Denomination Count (ચલણી નોટો)</label>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="width:48px; font-weight:600;">₹500 &times;</span>
                  <input type="number" min="0" class="form-control denom-input" data-val="500" placeholder="0" style="padding:0.35rem 0.6rem;" />
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="width:48px; font-weight:600;">₹200 &times;</span>
                  <input type="number" min="0" class="form-control denom-input" data-val="200" placeholder="0" style="padding:0.35rem 0.6rem;" />
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="width:48px; font-weight:600;">₹100 &times;</span>
                  <input type="number" min="0" class="form-control denom-input" data-val="100" placeholder="0" style="padding:0.35rem 0.6rem;" />
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="width:48px; font-weight:600;">₹50 &times;</span>
                  <input type="number" min="0" class="form-control denom-input" data-val="50" placeholder="0" style="padding:0.35rem 0.6rem;" />
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="width:48px; font-weight:600;">₹20 &times;</span>
                  <input type="number" min="0" class="form-control denom-input" data-val="20" placeholder="0" style="padding:0.35rem 0.6rem;" />
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="width:48px; font-weight:600;">₹10 &times;</span>
                  <input type="number" min="0" class="form-control denom-input" data-val="10" placeholder="0" style="padding:0.35rem 0.6rem;" />
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem; grid-column:span 2;">
                  <span style="width:48px; font-weight:600;">Coins:</span>
                  <input type="number" step="1" min="0" class="form-control denom-input" data-val="1" placeholder="Coins ₹ amount" style="padding:0.35rem 0.6rem;" />
                </div>
              </div>
            </div>

            <!-- Tally & Variance Box -->
            <div style="border-top:1px solid var(--border-subtle); padding-top:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                <span>Total Physical Cash:</span>
                <span style="font-weight:700; color:#10b981;" class="font-tabular" id="total-counted-cash">₹0.00</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                <span>Variance (Short / Excess):</span>
                <span style="font-weight:700;" class="font-tabular" id="cash-variance-val">₹0.00</span>
              </div>
            </div>

            <div>
              <label class="form-label">Closed & Verified By</label>
              <input type="text" id="day-closed-by" class="form-control" value="${defaultClosedBy}" />
            </div>
            <div>
              <label class="form-label">Closing Notes / Discrepancy Reason</label>
              <input type="text" id="day-close-notes" class="form-control" placeholder="e.g. Matches drawer exact tally" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-dayclose">Cancel</button>
            <button type="submit" class="btn btn-primary">Lock & Close Daybook</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const inputs = container.querySelectorAll('.denom-input');
  const countedEl = document.getElementById('total-counted-cash');
  const varianceEl = document.getElementById('cash-variance-val');

  function updateTally() {
    let sumRupees = 0;
    inputs.forEach(inp => {
      const multiplier = parseInt(inp.dataset.val, 10) || 1;
      const count = parseInt(inp.value, 10) || 0;
      sumRupees += (multiplier * count);
    });
    const countedPaise = sumRupees * 100;
    const variancePaise = countedPaise - systemCashPaise;

    if (countedEl) countedEl.textContent = formatINR(countedPaise);
    if (varianceEl) {
      const sign = variancePaise >= 0 ? '+' : '';
      varianceEl.textContent = `${sign}${formatINR(variancePaise)}`;
      varianceEl.style.color = variancePaise === 0 ? 'var(--text-main)' : (variancePaise > 0 ? '#10b981' : '#ef4444');
    }
  }

  inputs.forEach(inp => inp.addEventListener('input', updateTally));

  document.getElementById('btn-close-daymodal')?.addEventListener('click', closeDayCloseModal);
  document.getElementById('btn-cancel-dayclose')?.addEventListener('click', closeDayCloseModal);

  document.getElementById('form-day-close')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let sumRupees = 0;
    const denoms = {};
    inputs.forEach(inp => {
      const val = inp.dataset.val;
      const count = parseInt(inp.value, 10) || 0;
      denoms[val] = count;
      sumRupees += (parseInt(val, 10) * count);
    });

    const countedPaise = sumRupees * 100;
    const closedBy = document.getElementById('day-closed-by').value.trim();
    const notes = document.getElementById('day-close-notes').value.trim();

    try {
      await vceApi.closeDay({
        close_date: currentDate,
        physical_cash_total: countedPaise,
        denominations_json: JSON.stringify(denoms),
        closed_by: closedBy,
        notes: notes || undefined
      });
      notify.success(`Daybook locked for ${currentDate}`);
      closeDayCloseModal();
      loadRojmelData(currentDate);
    } catch (err) {
      console.error(err);
      notify.error('Failed to close daybook');
    }
  });
}

function closeDayCloseModal() {
  const backdrop = document.getElementById('modal-close-backdrop');
  if (backdrop) backdrop.remove();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

