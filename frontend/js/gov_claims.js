/**
 * Government Claims Controller — VCE Pali e-Gram
 * Manages State Dept Tasks & Mandated ₹20/unit calculations
 */
import { vceApi, formatINR, rupeesToPaise, paiseToRupees, getTodayDateStr } from './api.js';

let ordersData = [];

document.addEventListener('DOMContentLoaded', () => {
  initGovClaims();
});

async function initGovClaims() {
  const addBtn = document.getElementById('btn-add-dept-order');
  if (addBtn) {
    addBtn.addEventListener('click', () => openAddOrderModal());
  }

  loadOrders();
}

async function loadOrders() {
  try {
    ordersData = await vceApi.getDeptOrders();
    renderSummary(ordersData);
    renderOrdersTable(ordersData);
  } catch (err) {
    console.error('Failed to load dept orders:', err);
  }
}

function renderSummary(orders) {
  let totalUnits = 0;
  let totalClaim = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let totalTds = 0;
  let totalDisallowed = 0;

  orders.forEach(o => {
    totalUnits += o.completed_units || 0;
    totalClaim += o.total_claim_amount || 0;
    totalReceived += o.amount_received || 0;
    totalPending += o.pending_claim_amount || 0;
    totalTds += o.tds_deducted || 0;
    totalDisallowed += o.disallowed_amount || 0;
  });

  const unitsEl = document.getElementById('val-total-units');
  const claimEl = document.getElementById('val-total-claim');
  const recEl = document.getElementById('val-total-received');
  const pendEl = document.getElementById('val-total-pending');
  const countBadge = document.getElementById('orders-count-badge');

  if (unitsEl) unitsEl.textContent = totalUnits.toLocaleString('en-IN');
  if (claimEl) claimEl.textContent = formatINR(totalClaim);
  if (recEl) {
    recEl.textContent = formatINR(totalReceived);
    const sub = recEl.parentElement.querySelector('.stat-subtext');
    if (sub && (totalTds > 0 || totalDisallowed > 0)) {
      sub.innerHTML = `Disbursed &bull; TDS Asset: <b style="color:#f59e0b;">${formatINR(totalTds)}</b>`;
    }
  }
  if (pendEl) pendEl.textContent = formatINR(totalPending);
  if (countBadge) countBadge.textContent = `${orders.length} Tasks`;
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('tbody-dept-orders');
  const mobileList = document.getElementById('mobile-orders-list');

  if (orders.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--text-dim); padding:2rem;">No government tasks recorded. Click "+ New Govt Task" above to add one.</td></tr>`;
    if (mobileList) mobileList.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:2rem 1rem; font-size:0.875rem;">No government tasks recorded.</div>`;
    return;
  }

  if (tbody) {
    tbody.innerHTML = orders.map(o => {
      const target = o.target_units || 0;
      const completed = o.completed_units || 0;
      const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 100;
      const tds = o.tds_deducted || 0;
      const disallowed = o.disallowed_amount || 0;

      let statusBadgeClass = 'badge-waiting';
      if (o.claim_status === 'Disbursed') statusBadgeClass = 'badge-completed';
      else if (o.claim_status === 'In Progress') statusBadgeClass = 'badge-in-progress';
      else if (o.claim_status === 'Claim Submitted') statusBadgeClass = 'badge-planned';

      return `
        <tr>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${escapeHtml(o.scheme_name)}</div>
            <div style="font-size:0.75rem; color:#f59e0b; font-weight:600;">${escapeHtml(o.dept_name)}</div>
          </td>
          <td style="font-size:0.8rem; color:var(--text-dim);">
            <div>${escapeHtml(o.order_ref || '-')}</div>
            <div style="font-size:0.75rem;">${escapeHtml(o.order_date || '')}</div>
          </td>
          <td style="min-width:140px;">
            <div style="display:flex; justify-content:space-between; font-size:0.775rem; margin-bottom:0.25rem;">
              <span><b>${completed}</b> / ${target || 'Open Target'}</span>
              <span style="color:var(--text-dim);">${pct}%</span>
            </div>
            <div style="width:100%; height:6px; background:var(--border-default); border-radius:3px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:#f59e0b; border-radius:3px;"></div>
            </div>
          </td>
          <td class="font-tabular" style="font-weight:600;">${formatINR(o.unit_rate)}</td>
          <td class="font-tabular" style="font-weight:700; color:#10b981;">${formatINR(o.total_claim_amount)}</td>
          <td class="font-tabular" style="font-weight:600;">${formatINR(o.amount_received)}</td>
          <td class="font-tabular" style="font-size:0.8rem;">
            ${tds > 0 ? `<div style="color:#f59e0b; font-weight:600;">TDS: -${formatINR(tds)}</div>` : ''}
            ${disallowed > 0 ? `<div style="color:var(--expense); font-weight:600;">Cut: -${formatINR(disallowed)}</div>` : ''}
            ${tds === 0 && disallowed === 0 ? '<span style="color:var(--text-dim);">-</span>' : ''}
          </td>
          <td class="font-tabular" style="font-weight:700; color:${o.pending_claim_amount > 0 ? '#ef4444' : '#10b981'};">
            ${formatINR(o.pending_claim_amount)}
          </td>
          <td>
            <span class="badge ${statusBadgeClass}">${escapeHtml(o.claim_status)}</span>
          </td>
          <td style="text-align:right;">
            <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
              <button class="btn btn-outline btn-sm btn-edit-order" data-id="${o.id}" title="Update">
                Update
              </button>
              <button class="btn btn-outline btn-sm btn-bill-order" data-id="${o.id}" title="Generate Voucher">
                Bill
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (mobileList) {
    mobileList.innerHTML = orders.map(o => {
      const target = o.target_units || 0;
      const completed = o.completed_units || 0;
      const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 100;

      let statusBadgeClass = 'badge-waiting';
      if (o.claim_status === 'Disbursed') statusBadgeClass = 'badge-completed';
      else if (o.claim_status === 'In Progress') statusBadgeClass = 'badge-in-progress';
      else if (o.claim_status === 'Claim Submitted') statusBadgeClass = 'badge-planned';

      return `
        <div class="mobile-card">
          <div class="mobile-card-header">
            <div class="mobile-card-title-group">
              <span style="font-size:0.75rem; color:#f59e0b; font-weight:700;">${escapeHtml(o.dept_name)}</span>
              <div class="mobile-card-title">${escapeHtml(o.scheme_name)}</div>
              <div class="mobile-card-subtitle">
                <span>Ref: ${escapeHtml(o.order_ref || 'Official Mandate')}</span>
                <span>&bull; Rate: <b style="color:var(--gov-mandate);">${formatINR(o.unit_rate)}/unit</b></span>
              </div>
            </div>
            <span class="badge ${statusBadgeClass}">${escapeHtml(o.claim_status)}</span>
          </div>

          <div class="mobile-card-body">
            <!-- Progress Bar -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.775rem; margin-bottom:0.25rem;">
                <span>Progress: <b>${completed}</b> / ${target || 'Open Target'} units</span>
                <span style="font-weight:700; color:var(--text-main);">${pct}%</span>
              </div>
              <div style="width:100%; height:6px; background:var(--border-default); border-radius:3px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:var(--gov-mandate); border-radius:3px;"></div>
              </div>
            </div>

            <div class="mobile-card-metric-row">
              <div>
                <div class="mobile-card-metric-label">Total Claim</div>
                <div class="mobile-card-metric-val" style="color:var(--revenue);">${formatINR(o.total_claim_amount)}</div>
              </div>
              <div>
                <div class="mobile-card-metric-label">Received</div>
                <div class="mobile-card-metric-val">${formatINR(o.amount_received)}</div>
              </div>
              <div>
                <div class="mobile-card-metric-label">Pending</div>
                <div class="mobile-card-metric-val" style="${o.pending_claim_amount > 0 ? 'color:var(--expense);' : 'color:var(--revenue);'}">${formatINR(o.pending_claim_amount)}</div>
              </div>
            </div>
          </div>

          <div class="mobile-card-actions">
            <button class="btn btn-outline btn-sm btn-edit-order" data-id="${o.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Update Entry</span>
            </button>
            <button class="btn btn-outline btn-sm btn-bill-order" data-id="${o.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Voucher Bill</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Attach handlers across desktop table and mobile cards
  document.querySelectorAll('.btn-edit-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = parseInt(btn.dataset.id);
      const order = ordersData.find(x => x.id === orderId);
      if (order) openEditOrderModal(order);
    });
  });

  document.querySelectorAll('.btn-bill-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = parseInt(btn.dataset.id);
      const order = ordersData.find(x => x.id === orderId);
      if (order) printOrderBill(order);
    });
  });
}

function openAddOrderModal() {
  let modalContainer = document.getElementById('dynamic-page-modal');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'dynamic-page-modal';
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <div class="modal-backdrop open" id="order-modal-backdrop">
      <div class="modal-dialog" style="max-width:520px;">
        <div class="modal-header">
          <h3 class="modal-title">New Government Task</h3>
          <button class="modal-close" id="btn-close-modal">&times;</button>
        </div>
        <form id="order-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Department Name *</label>
              <select id="input-dept-name" class="form-select" required>
                <option value="Health Department">Health Department</option>
                <option value="Agriculture Department">Agriculture Department</option>
                <option value="Election / BLO">Election / BLO</option>
                <option value="Panchayat Department">Panchayat Department</option>
                <option value="Social Justice & Empowerment">Social Justice & Empowerment</option>
                <option value="Food & Civil Supplies">Food & Civil Supplies</option>
                <option value="Animal Husbandry">Animal Husbandry</option>
                <option value="Other Department">Other Department</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Scheme / Campaign Name *</label>
              <input type="text" id="input-scheme-name" class="form-control" placeholder="e.g. Ayushman Bharat e-KYC Survey or AgriStack Registry" required />
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Order / Circular Reference No.</label>
                <input type="text" id="input-order-ref" class="form-control" placeholder="e.g. TPO/EGRAM/2026/102" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Order Date</label>
                <input type="date" id="input-order-date" class="form-control" value="${getTodayDateStr()}" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Target Units</label>
                <input type="number" id="input-target-units" class="form-control" min="0" value="100" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Completed Units *</label>
                <input type="number" id="input-completed-units" class="form-control" min="0" value="0" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Govt Mandated Rate (₹ per Unit) *</label>
                <input type="number" id="input-unit-rate" class="form-control" min="1" step="0.5" value="20.00" required />
                <span style="font-size:0.75rem; color:#f59e0b;">Minimum ₹20.00 as per Gujarat Govt resolution</span>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Claim Status</label>
                <select id="input-claim-status" class="form-select">
                  <option value="In Progress" selected>In Progress</option>
                  <option value="Claim Submitted">Claim Submitted</option>
                  <option value="Verified">Verified</option>
                  <option value="Disbursed">Disbursed</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea id="input-notes" class="form-control" rows="2" placeholder="Additional details..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background:#f59e0b; color:#000; font-weight:700;">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('order-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'order-modal-backdrop') closeModal();
  });

  document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      dept_name: document.getElementById('input-dept-name').value,
      scheme_name: document.getElementById('input-scheme-name').value,
      order_ref: document.getElementById('input-order-ref').value,
      order_date: document.getElementById('input-order-date').value,
      target_units: parseInt(document.getElementById('input-target-units').value) || 0,
      completed_units: parseInt(document.getElementById('input-completed-units').value) || 0,
      unit_rate: rupeesToPaise(document.getElementById('input-unit-rate').value || '20.00'),
      claim_status: document.getElementById('input-claim-status').value,
      notes: document.getElementById('input-notes').value
    };

    try {
      await vceApi.createDeptOrder(payload);
      closeModal();
      loadOrders();
    } catch (err) {
      alert('Error creating order: ' + err.message);
    }
  });
}

function openEditOrderModal(order) {
  let modalContainer = document.getElementById('dynamic-page-modal');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'dynamic-page-modal';
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <div class="modal-backdrop open" id="order-modal-backdrop">
      <div class="modal-dialog" style="max-width:520px;">
        <div class="modal-header">
          <h3 class="modal-title">Update Task & Record Disbursement</h3>
          <button class="modal-close" id="btn-close-modal">&times;</button>
        </div>
        <form id="edit-order-form">
          <div class="modal-body">
            <div style="font-weight:700; margin-bottom:0.25rem;">${escapeHtml(order.scheme_name)}</div>
            <div style="font-size:0.8rem; color:#f59e0b; margin-bottom:1rem;">${escapeHtml(order.dept_name)}</div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Completed Units</label>
                <input type="number" id="input-edit-completed" class="form-control" min="0" value="${order.completed_units}" required />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Unit Rate (₹)</label>
                <input type="number" id="input-edit-rate" class="form-control" min="1" step="0.5" value="${paiseToRupees(order.unit_rate)}" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Amount Disbursed / Received (₹)</label>
                <input type="number" id="input-edit-received" class="form-control font-tabular" min="0" step="0.5" value="${paiseToRupees(order.amount_received)}" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Status</label>
                <select id="input-edit-status" class="form-select">
                  <option value="In Progress" ${order.claim_status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Claim Submitted" ${order.claim_status === 'Claim Submitted' ? 'selected' : ''}>Claim Submitted</option>
                  <option value="Verified" ${order.claim_status === 'Verified' ? 'selected' : ''}>Verified</option>
                  <option value="Disbursed" ${order.claim_status === 'Disbursed' ? 'selected' : ''}>Disbursed</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">TDS Deducted u/s 194C (₹)</label>
                <input type="number" id="input-edit-tds" class="form-control font-tabular" min="0" step="0.5" value="${paiseToRupees(order.tds_deducted || 0)}" />
                <span style="font-size:0.75rem; color:#f59e0b;">Tax withheld asset (claimable in ITR)</span>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Disallowed / Deductions (₹)</label>
                <input type="number" id="input-edit-disallowed" class="form-control font-tabular" min="0" step="0.5" value="${paiseToRupees(order.disallowed_amount || 0)}" />
                <span style="font-size:0.75rem; color:var(--text-dim);">Rejected entries / dept penalty</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Claim Submission Date</label>
                <input type="date" id="input-edit-sub-date" class="form-control" value="${order.submission_date || ''}" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Disbursement Date</label>
                <input type="date" id="input-edit-dis-date" class="form-control" value="${order.disbursement_date || ''}" />
              </div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content:space-between;">
            <button type="button" class="btn btn-outline btn-danger" id="btn-delete-order">Delete</button>
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="btn btn-outline" id="btn-cancel-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background:#f59e0b; color:#000; font-weight:700;">Update Task</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('order-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'order-modal-backdrop') closeModal();
  });

  document.getElementById('btn-delete-order').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this government work order?')) {
      await vceApi.deleteDeptOrder(order.id);
      closeModal();
      loadOrders();
    }
  });

  document.getElementById('edit-order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      completed_units: parseInt(document.getElementById('input-edit-completed').value) || 0,
      unit_rate: rupeesToPaise(document.getElementById('input-edit-rate').value),
      amount_received: rupeesToPaise(document.getElementById('input-edit-received').value),
      tds_deducted: rupeesToPaise(document.getElementById('input-edit-tds').value || 0),
      disallowed_amount: rupeesToPaise(document.getElementById('input-edit-disallowed').value || 0),
      claim_status: document.getElementById('input-edit-status').value,
      submission_date: document.getElementById('input-edit-sub-date').value || null,
      disbursement_date: document.getElementById('input-edit-dis-date').value || null
    };

    try {
      await vceApi.updateDeptOrder(order.id, payload);
      closeModal();
      loadOrders();
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  });
}

function printOrderBill(order) {
  const printWindow = window.open('', '_blank');
  const totalAmount = formatINR(order.total_claim_amount);
  const pendingAmount = formatINR(order.pending_claim_amount);
  const receivedAmount = formatINR(order.amount_received);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Government Work Claim Voucher — ${order.scheme_name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; color: #111; }
        .bill-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .bill-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 0.25rem; }
        .bill-sub { font-size: 0.9rem; color: #444; }
        table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
        th, td { border: 1px solid #333; padding: 0.65rem 0.85rem; text-align: left; }
        th { background: #f3f4f6; }
        .text-right { text-align: right; }
        .sign-area { display: flex; justify-content: space-between; margin-top: 3.5rem; }
        .sign-box { text-align: center; width: 200px; border-top: 1px solid #333; padding-top: 0.5rem; font-size: 0.85rem; }
      </style>
    </head>
    <body>
      <div class="bill-header">
        <div class="bill-title">Gram Panchayat e-Gram Center — Departmental Claim Voucher</div>
        <div class="bill-sub">Proposal for Payment under Gujarat Govt Mandated ₹20/- per Unit Norms</div>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:1rem;">
        <div><b>Department:</b> ${escapeHtml(order.dept_name)}</div>
        <div><b>Date:</b> ${getTodayDateStr()}</div>
      </div>
      <div style="font-size:0.9rem; margin-bottom:1rem;">
        <b>Scheme / Task:</b> ${escapeHtml(order.scheme_name)} | <b>Reference No:</b> ${escapeHtml(order.order_ref || 'N/A')}
      </div>

      <table>
        <thead>
          <tr>
            <th>Sr.</th>
            <th>Task Description</th>
            <th class="text-right">Completed Units</th>
            <th class="text-right">Approved Rate (₹)</th>
            <th class="text-right">Total Claim (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>${escapeHtml(order.scheme_name)} (Online Data Entry / Survey / Verification)</td>
            <td class="text-right">${order.completed_units}</td>
            <td class="text-right">${formatINR(order.unit_rate)}</td>
            <td class="text-right"><b>${totalAmount}</b></td>
          </tr>
          <tr>
            <td colspan="4" class="text-right"><b>Amount Previously Received:</b></td>
            <td class="text-right">${receivedAmount}</td>
          </tr>
          <tr>
            <td colspan="4" class="text-right" style="font-size:1.05rem;"><b>Net Pending Payable:</b></td>
            <td class="text-right" style="font-size:1.05rem; font-weight:800;">${pendingAmount}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:0.85rem; line-height:1.5; margin-top:1rem;">
        It is hereby certified that the above work has been successfully completed at the e-Gram Center and the records have been uploaded to the respective government portal. Payment is requested to be credited to the VCE bank account.
      </div>

      <div class="sign-area">
        <div class="sign-box">VCE Signature<br/>(VCE Operator)</div>
        <div class="sign-box">Talati-cum-Mantri<br/>(Sign & Stamp)</div>
        <div class="sign-box">Sarpanch<br/>(Sign & Stamp)</div>
      </div>

      <script>
        window.print();
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
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
