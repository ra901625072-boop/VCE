/**
 * Applications & Services Controller — VCE Pali e-Gram
 */
import { api, vceApi, formatINR, formatDate, paiseToRupees, rupeesToPaise, getTodayDateStr, getCurrentTimeStr } from './api.js';
import { notify } from '../components/notification.js';

let serviceCatalog = [];
let citizensList = [];
let currentActiveWork = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initWorkPage();
});

async function initWorkPage() {
  try {
    // Load Service Catalog
    serviceCatalog = await vceApi.getServicesCatalog();
    populateCategoryFilter();

    // Load Citizens
    citizensList = await api.get('/people');

    // Hook search & filter
    document.getElementById('work-search-input')?.addEventListener('input', debounce(loadWork, 300));
    document.getElementById('work-status-filter')?.addEventListener('change', loadWork);
    document.getElementById('work-category-filter')?.addEventListener('change', loadWork);

    // Add Work Button
    document.getElementById('btn-add-work-top')?.addEventListener('click', () => openAddAppModal());

    // Print Token Receipt
    document.getElementById('btn-print-token-receipt')?.addEventListener('click', () => {
      if (currentActiveWork) printCitizenReceipt(currentActiveWork);
    });

    // Close Modal triggers
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => {
          m.classList.remove('active');
          m.classList.remove('open');
        });
      });
    });

    const timelineModal = document.getElementById('modal-work-timeline');
    timelineModal?.addEventListener('click', (e) => {
      if (e.target === timelineModal) {
        timelineModal.classList.remove('active');
        timelineModal.classList.remove('open');
      }
    });

    // Initial Load
    await loadWork();

    // Check URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const serviceParam = urlParams.get('service');
    if (action === 'new' || serviceParam) {
      openAddAppModal(serviceParam);
    }
  } catch (err) {
    console.error('Failed to initialize work page:', err);
  }
}

function populateCategoryFilter() {
  const select = document.getElementById('work-category-filter');
  if (!select) return;

  const categories = [...new Set(serviceCatalog.map(s => s.category))];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

async function loadWork() {
  try {
    const q = document.getElementById('work-search-input')?.value.trim();
    const status = document.getElementById('work-status-filter')?.value;
    const category = document.getElementById('work-category-filter')?.value;

    const items = await api.get('/work', { query: q, status, category });
    renderWorkTable(items);
  } catch (err) {
    console.error(err);
    notify.error('Failed to load applications');
  }
}

function renderWorkTable(items) {
  const tbody = document.getElementById('work-table-body');
  const mobileList = document.getElementById('mobile-work-list');
  const countBadge = document.getElementById('work-count-badge');
  if (countBadge) countBadge.textContent = `${items.length} Applications`;

  if (items.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:3rem; color:var(--text-dim);">No applications found. Click "+ New Application" above to add one.</td></tr>`;
    if (mobileList) mobileList.innerHTML = `<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.875rem;">No applications found. Tap "+ New Entry" below to register one.</div>`;
    return;
  }

  if (tbody) {
    tbody.innerHTML = items.map(w => {
      let statusClass = 'badge-waiting';
      if (w.status === 'Ready / Printed') statusClass = 'badge-planned';
      else if (w.status === 'Completed / Delivered') statusClass = 'badge-completed';
      else if (w.status === 'In Progress') statusClass = 'badge-in-progress';
      else if (w.status.includes('Cancelled') || w.status.includes('Rejected')) statusClass = 'badge-cancelled';

      const token = w.token_no || `TK-${w.id}`;
      const pending = w.pending_amount || 0;
      const pendingColor = pending > 0 ? 'color:#ef4444;' : 'color:#10b981;';

      return `
        <tr>
          <td>
            <span style="font-family:var(--font-mono); font-weight:700; color:#f97316; font-size:0.8rem;">${escapeHtml(token)}</span>
            ${w.ack_no ? `<div style="font-size:0.7rem; color:var(--text-dim);">Ack: ${escapeHtml(w.ack_no)}</div>` : ''}
          </td>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${escapeHtml(w.person_name || 'Citizen')}</div>
            <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(w.person_phone || '')}</div>
          </td>
          <td>
            <div style="font-weight:500;">${escapeHtml(w.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-dim); display:flex; gap:0.5rem;">
              <span>${escapeHtml(w.service_category || w.category || '')}</span>
              ${w.portal_name ? `<span>&bull;</span><span style="color:#f59e0b; font-weight:600;">${escapeHtml(w.portal_name)}</span>` : ''}
            </div>
          </td>
          <td><span class="badge ${statusClass}">${escapeHtml(w.status)}</span></td>
          <td style="font-size:0.8rem; color:var(--text-dim);">${formatDate(w.start_date || w.created_at)}</td>
          <td class="font-tabular" style="text-align:right; font-weight:600;">${formatINR(w.agreed_amount)}</td>
          <td class="font-tabular" style="text-align:right; color:#10b981; font-weight:600;">${formatINR(w.received_amount)}</td>
          <td class="font-tabular" style="text-align:right; font-weight:700; ${pendingColor}">${formatINR(pending)}</td>
          <td style="text-align:center;">
            <div style="display:flex; justify-content:center; gap:0.35rem;">
              <button class="btn btn-outline btn-sm btn-view-timeline" data-work-id="${w.id}">Details</button>
              <button class="btn btn-outline btn-sm btn-quick-receipt" data-work-id="${w.id}" title="Receipt">Receipt</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (mobileList) {
    mobileList.innerHTML = items.map(w => {
      let statusClass = 'badge-waiting';
      if (w.status === 'Ready / Printed') statusClass = 'badge-planned';
      else if (w.status === 'Completed / Delivered') statusClass = 'badge-completed';
      else if (w.status === 'In Progress') statusClass = 'badge-in-progress';
      else if (w.status.includes('Cancelled') || w.status.includes('Rejected')) statusClass = 'badge-cancelled';

      const token = w.token_no || `TK-${w.id}`;
      const fee = w.agreed_amount || 0;
      const received = w.received_amount || 0;
      const pending = w.pending_amount || 0;
      const cleanPhone = (w.person_phone || '').replace(/[^0-9]/g, '');

      return `
        <div class="mobile-card">
          <div class="mobile-card-header">
            <div class="mobile-card-title-group">
              <span style="font-family:var(--font-mono); font-weight:700; color:var(--accent-light); font-size:0.825rem;">${escapeHtml(token)}</span>
              <div class="mobile-card-title">${escapeHtml(w.person_name || 'Citizen')}</div>
              <div class="mobile-card-subtitle">
                ${w.person_phone ? `
                  <span style="display:inline-flex; align-items:center; gap:0.2rem;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    <a href="tel:${w.person_phone}" style="color:var(--text-secondary); text-decoration:none;">${w.person_phone}</a>
                  </span>
                ` : ''}
                <span style="display:inline-flex; align-items:center; gap:0.2rem;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${formatDate(w.start_date || w.created_at)}
                </span>
              </div>
            </div>
            <span class="badge ${statusClass}">${escapeHtml(w.status)}</span>
          </div>

          <div class="mobile-card-body">
            <div style="font-weight:600; color:var(--text-main); font-size:0.875rem;">${escapeHtml(w.title)}</div>
            <div class="mobile-card-subtitle">
              <span>${escapeHtml(w.service_category || w.category || 'General')}</span>
              ${w.portal_name ? `<span>&bull;</span><span style="color:#f59e0b; font-weight:700;">${escapeHtml(w.portal_name)}</span>` : ''}
              ${w.ack_no ? `<span>&bull;</span><span>Ack: <b>${escapeHtml(w.ack_no)}</b></span>` : ''}
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

          <div class="mobile-card-actions">
            <button class="btn btn-outline btn-sm btn-view-timeline" data-work-id="${w.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Details</span>
            </button>
            <button class="btn btn-outline btn-sm btn-quick-receipt" data-work-id="${w.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Receipt</span>
            </button>
            ${cleanPhone.length >= 10 && pending > 0 ? `
              <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${w.person_name || ''}, your application for "${w.title}" at Gram Panchayat e-Gram Center has an unpaid balance of ₹${(pending/100).toFixed(2)}. Token: ${token}.`)}" target="_blank" class="btn-whatsapp-civic" title="WhatsApp Reminder">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span>WhatsApp</span>
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Bind View Timeline & Receipt across desktop table and mobile cards
  document.querySelectorAll('.btn-view-timeline').forEach(btn => {
    btn.addEventListener('click', () => openTimeline(btn.dataset.workId));
  });

  document.querySelectorAll('.btn-quick-receipt').forEach(btn => {
    btn.addEventListener('click', async () => {
      const wId = btn.dataset.workId;
      const data = await api.get(`/work/${wId}/timeline`);
      printCitizenReceipt(data);
    });
  });
}

async function openTimeline(workId) {
  try {
    const data = await api.get(`/work/${workId}/timeline`);
    currentActiveWork = data;

    const modal = document.getElementById('modal-work-timeline');
    document.getElementById('timeline-work-title').textContent = `${data.title} — Token: ${data.token_no || `TK-${data.id}`}`;

    const body = document.getElementById('timeline-modal-body');
    const pending = Math.max(0, (data.agreed_amount || 0) - (data.received_amount || 0));

    let paymentsHtml = '<p style="color:var(--text-dim); font-size:0.8rem; padding:0.5rem 0;">No payments recorded yet (Pending).</p>';
    if (data.payments && data.payments.length > 0) {
      paymentsHtml = `
        <div class="modal-table-container">
          <table class="data-table" style="font-size:0.8rem; margin-top:0;">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Reference / Notes</th>
                <th style="text-align:right;">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              ${data.payments.map(p => `
                <tr>
                  <td>${formatDate(p.payment_date)}</td>
                  <td><span class="badge ${p.payment_method === 'Cash' ? 'badge-completed' : 'badge-planned'}">${escapeHtml(p.payment_method)}</span></td>
                  <td>${escapeHtml(p.transaction_reference || p.notes || '-')}</td>
                  <td style="text-align:right; font-weight:700; color:var(--revenue);">${formatINR(p.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="modal-summary-grid">
        <div style="background:var(--bg-surface-elevated); padding:0.75rem; border-radius:6px; border:1px solid var(--border-subtle);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Citizen Name:</div>
          <div style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${escapeHtml(data.person_name)}</div>
          <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(data.person_phone || '-')}</div>
        </div>
        <div style="background:var(--bg-surface-elevated); padding:0.75rem; border-radius:6px; border:1px solid var(--border-subtle);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Portal & Service:</div>
          <div style="font-weight:700; color:#f97316;">${escapeHtml(data.portal_name || 'Direct')}</div>
          <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(data.service_category || data.category)}</div>
        </div>
        <div style="background:var(--bg-surface-elevated); padding:0.75rem; border-radius:6px; border:1px solid var(--border-subtle);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Fee Summary:</div>
          <div style="font-weight:700; font-size:1rem; color:var(--text-main);">${formatINR(data.agreed_amount)}</div>
          <div style="font-size:0.75rem; color:${pending > 0 ? 'var(--expense)' : 'var(--revenue)'}; font-weight:600;">
            ${pending > 0 ? `Pending: ${formatINR(pending)}` : 'Fully Paid'}
          </div>
        </div>
      </div>

      <div style="margin-bottom:1.25rem;">
        <h4 style="font-size:0.875rem; font-weight:700; margin-bottom:0.4rem;">Fee Split</h4>
        <div style="display:flex; flex-wrap:wrap; gap:1.5rem; background:var(--bg-subtle); padding:0.75rem 1rem; border-radius:6px; font-size:0.825rem;">
          <div>Portal Cost: <b class="font-tabular">${formatINR(data.portal_cost || 0)}</b></div>
          <div>Panchayat Share: <b class="font-tabular">${formatINR(data.panchayat_share || 0)}</b></div>
          <div>VCE Earning: <b class="font-tabular" style="color:#10b981;">${formatINR(data.vce_commission || 0)}</b></div>
        </div>
      </div>

      <div style="margin-bottom:1rem;">
        <h4 style="font-size:0.875rem; font-weight:700; margin-bottom:0.4rem;">Payment History</h4>
        ${paymentsHtml}
      </div>

      <!-- Quick Record Payment if pending -->
      ${pending > 0 ? `
        <div style="background:rgba(239,68,68,0.08); border:1px dashed rgba(239,68,68,0.3); padding:0.75rem 1rem; border-radius:6px; margin-top:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.85rem; font-weight:600; color:#ef4444;">₹${formatINR(pending)} is pending</span>
            <button class="btn btn-primary btn-sm" id="btn-timeline-collect-pay" style="background:#10b981; border:none;">
              + Collect Pending Fee
            </button>
          </div>
        </div>
      ` : ''}
    `;

    modal.classList.add('open');
    modal.classList.add('active');

    // Bind Quick Collect Payment
    document.getElementById('btn-timeline-collect-pay')?.addEventListener('click', () => {
      modal.classList.remove('active');
      modal.classList.remove('open');
      openCollectPaymentModal(data, pending);
    });
  } catch (err) {
    console.error(err);
    notify.error('Failed to load details');
  }
}

function openAddAppModal(preselectedServiceId = null) {
  document.getElementById('modal-add-app')?.remove();

  // Lock background scroll
  document.body.style.overflow = 'hidden';

  // Find preselected service
  const preService = serviceCatalog.find(s => s.id === preselectedServiceId);

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open';
  modalBackdrop.id = 'modal-add-app';
  modalBackdrop.innerHTML = `
    <div class="modal-dialog" style="max-width:560px;">
      <div class="modal-header">
        <h3 class="modal-title">New Citizen Service Application</h3>
        <button class="modal-close" id="btn-close-app-modal">&times;</button>
      </div>
      <form id="add-app-form">
          <div class="modal-body">
            <!-- Service Catalog Picker -->
            <div class="form-group">
              <label class="form-label">Service Type *</label>
              <select id="input-service-catalog" class="form-select">
                <option value="">-- Select Service from Catalog --</option>
                ${serviceCatalog.map(s => `
                  <option value="${s.id}" ${preselectedServiceId === s.id ? 'selected' : ''}>
                    ${s.name} [${s.portal}] — Fee: ₹${s.standard_fee / 100}
                  </option>
                `).join('')}
                <option value="custom">-- Other / General Digital Work --</option>
              </select>
            </div>

            <!-- Citizen Selector -->
            <div class="form-group">
              <label class="form-label">Citizen / Farmer Name *</label>
              <div style="display:flex; gap:0.5rem;">
                <select id="input-person-id" class="form-select" style="flex:1;" required>
                  <option value="">-- Select Citizen --</option>
                  ${citizensList.map(p => `
                    <option value="${p.id}">
                      ${p.name} ${p.village ? `(${p.village})` : ''} — ${p.phone || ''}
                    </option>
                  `).join('')}
                </select>
                <button type="button" class="btn btn-outline" id="btn-quick-new-citizen" style="white-space:nowrap;">
                  + New Citizen
                </button>
              </div>
            </div>

            <!-- Title & Category -->
            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Application Title *</label>
                <input type="text" id="input-app-title" class="form-control" value="${preService ? preService.name : ''}" placeholder="e.g. 7/12 RoR Extract or Income Certificate" required />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Portal Name</label>
                <input type="text" id="input-app-portal" class="form-control" value="${preService ? preService.portal : ''}" placeholder="AnyRoR, Digital Gujarat..." />
              </div>
            </div>

            <!-- Ack / Portal Ref -->
            <div class="form-group">
              <label class="form-label">Portal Application / Ack No.</label>
              <input type="text" id="input-app-ack" class="form-control" placeholder="Portal application or acknowledgement number" />
            </div>

            <!-- Financial Fee Split -->
            <div style="background:var(--bg-subtle); padding:0.85rem; border-radius:6px; margin-bottom:1rem;">
              <div style="font-weight:700; font-size:0.85rem; margin-bottom:0.5rem; color:#f97316;">Fee & Commission Split</div>
              <div class="form-row">
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Citizen Fee (₹) *</label>
                  <input type="number" id="input-app-fee" class="form-control" min="0" step="1" value="${preService ? preService.standard_fee / 100 : '50'}" required />
                </div>
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Portal Cost (₹)</label>
                  <input type="number" id="input-app-portal-cost" class="form-control" min="0" step="1" value="${preService ? preService.portal_cost / 100 : '0'}" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Panchayat Share (₹)</label>
                  <input type="number" id="input-app-gp-share" class="form-control" min="0" step="1" value="${preService ? preService.panchayat_share / 100 : '0'}" />
                </div>
                <div class="form-group" style="flex:1;">
                  <label class="form-label">VCE Earning (₹)</label>
                  <input type="number" id="input-app-vce-share" class="form-control" min="0" step="1" value="${preService ? preService.vce_commission / 100 : '50'}" readonly style="background:rgba(255,255,255,0.05);" />
                </div>
              </div>
            </div>

            <!-- Immediate Payment Collection -->
            <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); padding:0.85rem; border-radius:6px; margin-bottom:1rem;">
              <div class="form-group" style="margin-bottom:0.5rem;">
                <label class="form-label" style="font-weight:700; color:#10b981;">Payment Status</label>
                <div style="display:flex; gap:1.5rem;">
                  <label style="display:flex; align-items:center; gap:0.35rem; cursor:pointer;">
                    <input type="radio" name="payment_mode" value="collect_now" checked />
                    <b>Collect Now</b>
                  </label>
                  <label style="display:flex; align-items:center; gap:0.35rem; cursor:pointer;">
                    <input type="radio" name="payment_mode" value="udhar" />
                    <span style="color:#ef4444; font-weight:600;">Udhar / Pending</span>
                  </label>
                </div>
              </div>
              <div id="collect-now-fields" class="form-row" style="margin-top:0.5rem;">
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Payment Method</label>
                  <select id="input-app-pay-method" class="form-select">
                    <option value="Cash" selected>Cash</option>
                    <option value="UPI">UPI / PhonePe / GPay</option>
                  </select>
                </div>
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Amount Collected (₹)</label>
                  <input type="number" id="input-app-pay-amount" class="form-control" value="${preService ? preService.standard_fee / 100 : '50'}" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-app-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background:#f97316; border:none; font-weight:700;">
              Register Application & Issue Token
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeAddModal();
  });

  // Attach Catalog change handler
  const catalogSelect = document.getElementById('input-service-catalog');
  catalogSelect.addEventListener('change', (e) => {
    const sId = e.target.value;
    const selected = serviceCatalog.find(s => s.id === sId);
    if (selected) {
      document.getElementById('input-app-title').value = selected.name;
      document.getElementById('input-app-portal').value = selected.portal;
      document.getElementById('input-app-fee').value = selected.standard_fee / 100;
      document.getElementById('input-app-portal-cost').value = selected.portal_cost / 100;
      document.getElementById('input-app-gp-share').value = selected.panchayat_share / 100;
      document.getElementById('input-app-vce-share').value = selected.vce_commission / 100;
      document.getElementById('input-app-pay-amount').value = selected.standard_fee / 100;
    }
  });

  // Calculate VCE net earning on fee change
  const feeInput = document.getElementById('input-app-fee');
  const portalInput = document.getElementById('input-app-portal-cost');
  const gpInput = document.getElementById('input-app-gp-share');
  const vceInput = document.getElementById('input-app-vce-share');
  const payAmtInput = document.getElementById('input-app-pay-amount');

  function recalcEarnings() {
    const fee = parseFloat(feeInput.value) || 0;
    const portal = parseFloat(portalInput.value) || 0;
    const gp = parseFloat(gpInput.value) || 0;
    vceInput.value = Math.max(0, fee - portal - gp);
    payAmtInput.value = fee;
  }
  feeInput.addEventListener('input', recalcEarnings);
  portalInput.addEventListener('input', recalcEarnings);
  gpInput.addEventListener('input', recalcEarnings);

  // Toggle Collect Now vs Udhar
  const radios = document.querySelectorAll('input[name="payment_mode"]');
  radios.forEach(r => {
    r.addEventListener('change', (e) => {
      const box = document.getElementById('collect-now-fields');
      box.style.display = e.target.value === 'collect_now' ? 'flex' : 'none';
    });
  });

  // Quick citizen inline add
  document.getElementById('btn-quick-new-citizen').addEventListener('click', () => {
    const name = prompt('Applicant Full Name:');
    if (name && name.trim()) {
      const phone = prompt('Mobile Number:') || '';
      const village = prompt('Village / Locality:') || '';
      api.post('/people', { name: name.trim(), phone, village }).then(newCitizen => {
        citizensList.push(newCitizen);
        const opt = document.createElement('option');
        opt.value = newCitizen.id;
        opt.textContent = `${newCitizen.name} (${newCitizen.village || ''}) — ${newCitizen.phone || ''}`;
        opt.selected = true;
        document.getElementById('input-person-id').appendChild(opt);
      });
    }
  });

  document.getElementById('btn-close-app-modal').addEventListener('click', closeAddModal);
  document.getElementById('btn-cancel-app-modal').addEventListener('click', closeAddModal);

  document.getElementById('add-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feeRupees = parseFloat(document.getElementById('input-app-fee').value) || 0;
    const portalRupees = parseFloat(document.getElementById('input-app-portal-cost').value) || 0;
    const gpRupees = parseFloat(document.getElementById('input-app-gp-share').value) || 0;
    const vceRupees = parseFloat(document.getElementById('input-app-vce-share').value) || 0;
    const selectedCatalog = serviceCatalog.find(s => s.id === catalogSelect.value);

    const appPayload = {
      person_id: parseInt(document.getElementById('input-person-id').value),
      title: document.getElementById('input-app-title').value,
      service_category: selectedCatalog ? selectedCatalog.category : 'General',
      service_name: selectedCatalog ? selectedCatalog.name : document.getElementById('input-app-title').value,
      portal_name: document.getElementById('input-app-portal').value,
      ack_no: document.getElementById('input-app-ack').value,
      agreed_amount: Math.round(feeRupees * 100),
      portal_cost: Math.round(portalRupees * 100),
      panchayat_share: Math.round(gpRupees * 100),
      vce_commission: Math.round(vceRupees * 100),
      status: 'In Progress',
      start_date: getTodayDateStr()
    };

    try {
      const created = await api.post('/work', appPayload);

      // If collect now, record payment
      const paymentMode = document.querySelector('input[name="payment_mode"]:checked')?.value;
      if (paymentMode === 'collect_now') {
        const payAmountRupees = parseFloat(document.getElementById('input-app-pay-amount').value) || feeRupees;
        const payMethod = document.getElementById('input-app-pay-method').value;
        await api.post('/payments', {
          person_id: appPayload.person_id,
          work_id: created.id,
          amount: Math.round(payAmountRupees * 100),
          payment_method: payMethod,
          payment_date: getTodayDateStr(),
          payment_time: getCurrentTimeStr(),
          notes: `Fee payment (${payMethod})`
        });
      }

      closeAddModal();
      notify.success(`Application registered successfully! Token: ${created.token_no}`);
      loadWork();
    } catch (err) {
      alert('Error creating application: ' + err.message);
    }
  });
}

function openCollectPaymentModal(work, pendingAmount) {
  document.getElementById('modal-collect-pay')?.remove();
  document.body.style.overflow = 'hidden';

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open';
  modalBackdrop.id = 'modal-collect-pay';
  modalBackdrop.innerHTML = `
    <div class="modal-dialog" style="max-width:420px;">
      <div class="modal-header">
        <h3 class="modal-title">Collect Pending Fee</h3>
        <button class="modal-close" id="btn-close-pay-modal">&times;</button>
      </div>
      <form id="collect-pay-form">
        <div class="modal-body">
          <div style="font-weight:700; margin-bottom:0.25rem;">${escapeHtml(work.title)}</div>
          <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:1rem;">
            Citizen: <b>${escapeHtml(work.person_name)}</b> | Pending: <b style="color:#ef4444;">${formatINR(pendingAmount)}</b>
          </div>

          <div class="form-group">
            <label class="form-label">Amount to Collect (₹) *</label>
            <input type="number" id="input-collect-amount" class="form-control" min="1" step="1" value="${paiseToRupees(pendingAmount)}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Payment Method *</label>
            <select id="input-collect-method" class="form-select" required>
              <option value="Cash" selected>Cash</option>
              <option value="UPI">UPI / PhonePe / GPay</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Reference / Notes</label>
            <input type="text" id="input-collect-notes" class="form-control" placeholder="Udhar recovery notes" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-pay-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" style="background:#10b981; border:none; font-weight:700;">
            Collect Payment
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  document.getElementById('btn-close-pay-modal').addEventListener('click', closePayModal);
  document.getElementById('btn-cancel-pay-modal').addEventListener('click', closePayModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closePayModal();
  });

  document.getElementById('collect-pay-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amt = parseFloat(document.getElementById('input-collect-amount').value);
    const method = document.getElementById('input-collect-method').value;
    const notes = document.getElementById('input-collect-notes').value;

    try {
      await api.post('/payments', {
        person_id: work.person_id,
        work_id: work.id,
        amount: Math.round(amt * 100),
        payment_method: method,
        payment_date: getTodayDateStr(),
        payment_time: getCurrentTimeStr(),
        notes: notes || 'Udhar balance recovery'
      });
      closePayModal();
      notify.success('Payment recorded successfully!');
      loadWork();
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    }
  });
}

function printCitizenReceipt(work) {
  const printWindow = window.open('', '_blank');
  const token = work.token_no || `TK-${work.id}`;
  const fee = formatINR(work.agreed_amount);
  const paid = formatINR(work.received_amount || work.agreed_amount);
  const pending = formatINR(Math.max(0, (work.agreed_amount || 0) - (work.received_amount || 0)));

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>e-Gram Service Receipt — ${token}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 1.5rem; color: #111; max-width: 480px; margin: 0 auto; border: 1px dashed #444; border-radius: 8px; }
        .receipt-header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .receipt-title { font-size: 1.15rem; font-weight: 800; }
        .receipt-sub { font-size: 0.8rem; color: #444; }
        .token-box { text-align: center; background: #f3f4f6; padding: 0.5rem; border-radius: 6px; margin: 0.75rem 0; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.05em; }
        .row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.35rem 0; border-bottom: 1px dotted #ccc; }
        .footer { text-align: center; font-size: 0.75rem; color: #666; margin-top: 1.5rem; }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div class="receipt-title">e-Gram Vishwagram Center</div>
        <div class="receipt-sub">Gram Panchayat Digital Service Acknowledgement Receipt</div>
      </div>

      <div class="token-box">Token No: ${token}</div>

      <div class="row"><span>Citizen Name:</span><b>${escapeHtml(work.person_name)}</b></div>
      <div class="row"><span>Service Name:</span><b>${escapeHtml(work.title)}</b></div>
      <div class="row"><span>Portal:</span><b>${escapeHtml(work.portal_name || 'e-Gram')}</b></div>
      ${work.ack_no ? `<div class="row"><span>Application No:</span><b>${escapeHtml(work.ack_no)}</b></div>` : ''}
      <div class="row"><span>Application Date:</span><span>${formatDate(work.start_date || getTodayDateStr())}</span></div>
      <div class="row" style="margin-top:0.5rem;"><span>Total Service Fee:</span><b>${fee}</b></div>
      <div class="row"><span>Amount Received:</span><b style="color:green;">${paid}</b></div>
      <div class="row"><span>Balance Pending:</span><b>${pending}</b></div>

      <div class="footer">
        <div>Please retain this receipt. Present this token when collecting your document.</div>
        <div style="margin-top:0.5rem;">Computer-generated receipt | No signature required</div>
      </div>

      <script>
        window.print();
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function closeAddModal() {
  const modal = document.getElementById('modal-add-app');
  if (modal) modal.remove();
  document.body.style.overflow = '';
}

function closePayModal() {
  const modal = document.getElementById('modal-collect-pay');
  if (modal) modal.remove();
  document.body.style.overflow = '';
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
