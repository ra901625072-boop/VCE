/**
 * Citizens & Farmers Ledger Controller — VCE Pali e-Gram
 */
import { api, formatINR, formatDate } from './api.js';
import { notify } from '../components/notification.js';
import { closeModalAnimated } from '../components/modal.js';
import { shakeInput, animateRowRemoval } from './animations.js';

let allCitizens = [];

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initPeoplePage());
} else {
  initPeoplePage();
}

function initPeoplePage() {
  document.getElementById('people-search-input')?.addEventListener('input', debounce(filterAndRender, 250));
  document.getElementById('people-type-filter')?.addEventListener('change', filterAndRender);
  document.getElementById('check-only-udhar')?.addEventListener('change', filterAndRender);

  document.getElementById('btn-add-person-top')?.addEventListener('click', () => openAddPersonModal());

  // Close modals
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop.open, .modal-backdrop.active').forEach(m => {
        closeModalAnimated(m);
      });
    });
  });

  const detailModal = document.getElementById('modal-person-detail');
  detailModal?.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      closeModalAnimated(detailModal);
    }
  });

  loadPeople();
}

async function loadPeople() {
  try {
    allCitizens = await api.get('/people');
    filterAndRender();
  } catch (err) {
    console.error(err);
    notify.error('Failed to load citizens');
  }
}

function filterAndRender() {
  const q = document.getElementById('people-search-input')?.value.toLowerCase().trim() || '';
  const typeFilter = document.getElementById('people-type-filter')?.value || '';
  const onlyUdhar = document.getElementById('check-only-udhar')?.checked || false;

  let filtered = allCitizens.filter(p => {
    if (typeFilter && !(p.citizen_type || 'General').toLowerCase().includes(typeFilter.toLowerCase())) return false;
    if (onlyUdhar && (p.total_pending || 0) <= 0) return false;
    if (q) {
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchPhone = (p.phone || '').toLowerCase().includes(q);
      const matchVillage = (p.village || '').toLowerCase().includes(q);
      const matchKhata = (p.khata_no || '').toLowerCase().includes(q);
      const matchRation = (p.ration_card_no || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchVillage && !matchKhata && !matchRation) return false;
    }
    return true;
  });

  renderPeopleTable(filtered);
}

function renderPeopleTable(people) {
  const tbody = document.getElementById('people-table-body');
  const countBadge = document.getElementById('people-count-badge');
  const totalUdharBadge = document.getElementById('total-village-udhar-badge');

  let totalVillageUdhar = 0;
  allCitizens.forEach(p => { totalVillageUdhar += p.total_pending || 0; });

  if (countBadge) countBadge.textContent = `${people.length} Citizens`;
  if (totalUdharBadge) totalUdharBadge.textContent = `Total Udhar Pending: ${formatINR(totalVillageUdhar)}`;

  const mobileList = document.getElementById('mobile-people-list');

  if (people.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:3rem; color:var(--text-dim);">No citizens found.</td></tr>`;
    if (mobileList) mobileList.innerHTML = `<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.875rem;">No citizens found matching filter.</div>`;
    return;
  }

  if (tbody) {
    tbody.innerHTML = people.map(p => {
      const pending = p.total_pending || 0;
      const pendingColor = pending > 0 ? 'color:#ef4444;' : 'color:#10b981;';
      const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
      const isFarmer = (p.citizen_type || '').toLowerCase().includes('farmer');

      return `
        <tr data-person-id="${p.id}">
          <td>
            <div style="font-weight:600; color:var(--text-main); font-size:0.9rem;">${escapeHtml(p.name)}</div>
            <span class="badge ${isFarmer ? 'badge-completed' : 'badge-waiting'}" style="font-size:0.675rem; margin-top:0.2rem;">
              ${escapeHtml(p.citizen_type || 'General')}
            </span>
          </td>
          <td style="font-size:0.85rem; color:var(--text-dim);">
            ${escapeHtml(p.village || 'Main Village')}
          </td>
          <td style="font-size:0.85rem; font-family:var(--font-mono);">
            ${p.phone ? `
              <a href="tel:${p.phone}" style="color:var(--text-secondary); text-decoration:none;">${p.phone}</a>
              ${cleanPhone.length >= 10 && pending > 0 ? `
                <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${p.name}, your pending balance at Gram Panchayat e-Gram Center is ₹${(pending/100).toFixed(2)}. Please arrange for settlement.`)}" target="_blank" title="WhatsApp Reminder" style="margin-left:0.35rem; color:#10b981; text-decoration:none; display:inline-flex; align-items:center;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </a>
              ` : ''}
            ` : '-'}
          </td>
          <td style="font-size:0.8rem; color:var(--text-dim);">
            ${p.khata_no ? `<div>Khata No: <b>${escapeHtml(p.khata_no)}</b></div>` : ''}
            ${p.ration_card_no ? `<div>Ration Card: ${escapeHtml(p.ration_card_no)}</div>` : ''}
            ${!p.khata_no && !p.ration_card_no ? '-' : ''}
          </td>
          <td style="text-align:center;">
            <span class="badge ${p.active_work_count > 0 ? 'badge-in-progress' : 'badge-completed'}">
              ${p.active_work_count} / ${p.work_count}
            </span>
          </td>
          <td class="font-tabular" style="text-align:right; font-weight:600;">${formatINR(p.total_agreed)}</td>
          <td class="font-tabular" style="text-align:right; color:#10b981; font-weight:600;">${formatINR(p.total_received)}</td>
          <td class="font-tabular" style="text-align:right; font-weight:700; ${pendingColor}">${formatINR(pending)}</td>
          <td style="text-align:right; white-space:nowrap;">
            <div class="table-actions">
              <button class="btn-table-action btn-view-citizen" data-person-id="${p.id}" title="View Ledger">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>Ledger</span>
              </button>
              <button class="btn-table-action btn-table-icon btn-edit-citizen" data-person-id="${p.id}" title="Edit Citizen Profile" aria-label="Edit Citizen Profile">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-table-action btn-table-icon btn-delete-citizen" data-person-id="${p.id}" title="Delete Citizen" aria-label="Delete Citizen" style="color:var(--expense);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (mobileList) {
    mobileList.innerHTML = people.map(p => {
      const pending = p.total_pending || 0;
      const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
      const isFarmer = (p.citizen_type || '').toLowerCase().includes('farmer');

      return `
        <div class="mobile-card" data-person-id="${p.id}">
          <div class="mobile-card-header">
            <div class="mobile-card-title-group">
              <div class="mobile-card-title">${escapeHtml(p.name)}</div>
              <div class="mobile-card-subtitle">
                <span style="display:inline-flex; align-items:center; gap:0.2rem;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  ${escapeHtml(p.village || 'Main Village')}
                </span>
                ${p.phone ? `
                  <span>&bull;</span>
                  <span style="display:inline-flex; align-items:center; gap:0.2rem;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    <a href="tel:${p.phone}" style="color:var(--text-secondary); text-decoration:none;">${p.phone}</a>
                  </span>
                ` : ''}
              </div>
            </div>
            <span class="badge ${isFarmer ? 'badge-completed' : 'badge-waiting'}">
              ${escapeHtml(p.citizen_type || 'General')}
            </span>
          </div>

          <div class="mobile-card-body">
            <div style="font-size:0.775rem; color:var(--text-muted); display:flex; gap:0.75rem; flex-wrap:wrap;">
              ${p.khata_no ? `<span>Khata: <b style="color:var(--text-main);">${escapeHtml(p.khata_no)}</b></span>` : ''}
              ${p.ration_card_no ? `<span>Ration: <b style="color:var(--text-main);">${escapeHtml(p.ration_card_no)}</b></span>` : ''}
              <span>Applications: <b style="color:var(--text-main);">${p.active_work_count} active</b> (${p.work_count} total)</span>
            </div>

            <div class="mobile-card-metric-row">
              <div>
                <div class="mobile-card-metric-label">Total Fee</div>
                <div class="mobile-card-metric-val">${formatINR(p.total_agreed)}</div>
              </div>
              <div>
                <div class="mobile-card-metric-label">Received</div>
                <div class="mobile-card-metric-val" style="color:var(--revenue);">${formatINR(p.total_received)}</div>
              </div>
              <div>
                <div class="mobile-card-metric-label">Pending Udhar</div>
                <div class="mobile-card-metric-val" style="${pending > 0 ? 'color:var(--expense);' : 'color:var(--revenue);'}">${formatINR(pending)}</div>
              </div>
            </div>
          </div>

          <div class="mobile-card-actions" style="display:flex; flex-wrap:wrap; gap:0.4rem; justify-content:space-between; align-items:center;">
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm btn-view-citizen" data-person-id="${p.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>Ledger</span>
              </button>
              <button class="btn btn-outline btn-sm btn-edit-citizen" data-person-id="${p.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit</span>
              </button>
              <button class="btn btn-outline btn-sm btn-delete-citizen" data-person-id="${p.id}" style="color:var(--expense);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Delete</span>
              </button>
            </div>
            ${cleanPhone.length >= 10 && pending > 0 ? `
              <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${p.name}, your pending balance at Gram Panchayat e-Gram Center is ₹${(pending/100).toFixed(2)}. Please arrange for settlement.`)}" target="_blank" class="btn-whatsapp-civic" title="WhatsApp Reminder">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span>WhatsApp Reminder</span>
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Bind click handlers across desktop table and mobile cards
  document.querySelectorAll('.btn-view-citizen').forEach(btn => {
    btn.addEventListener('click', () => openPersonDetail(btn.dataset.personId));
  });
  document.querySelectorAll('.btn-edit-citizen').forEach(btn => {
    btn.addEventListener('click', () => openEditPersonModal(btn.dataset.personId));
  });
  document.querySelectorAll('.btn-delete-citizen').forEach(btn => {
    btn.addEventListener('click', () => deletePerson(btn.dataset.personId));
  });
}

async function openPersonDetail(personId) {
  try {
    const p = await api.get(`/people/${personId}/detail`);
    document.getElementById('person-detail-title').textContent = `${p.name} — Citizen Ledger`;

    const body = document.getElementById('person-detail-body');
    const pending = p.total_pending || 0;
    const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');

    let workRows = '<p style="color:var(--text-dim); font-size:0.8rem; padding:0.5rem 0;">No service applications recorded.</p>';
    if (p.work_history && p.work_history.length > 0) {
      workRows = `
        <div class="modal-table-container">
          <table class="data-table" style="font-size:0.8rem; margin-top:0;">
            <thead>
              <tr>
                <th>Service / Application</th>
                <th>Status</th>
                <th>Date</th>
                <th style="text-align:right;">Total Fee</th>
                <th style="text-align:right;">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${p.work_history.map(w => `
                <tr>
                  <td><b>${escapeHtml(w.title)}</b></td>
                  <td><span class="badge badge-waiting">${escapeHtml(w.status)}</span></td>
                  <td>${formatDate(w.start_date || w.created_at)}</td>
                  <td style="text-align:right;">${formatINR(w.agreed_amount)}</td>
                  <td style="text-align:right; font-weight:700; color:${w.pending_amount > 0 ? 'var(--expense)' : 'var(--revenue)'};">
                    ${formatINR(w.pending_amount)}
                  </td>
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
          <div style="font-size:0.75rem; color:var(--text-dim);">Citizen Details:</div>
          <div style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${escapeHtml(p.name)}</div>
          <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(p.village || 'Village')} | ${escapeHtml(p.citizen_type || 'General')}</div>
        </div>
        <div style="background:var(--bg-surface-elevated); padding:0.75rem; border-radius:6px; border:1px solid var(--border-subtle);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Contact & ID:</div>
          <div style="font-weight:600;">${escapeHtml(p.phone || '-')}</div>
          <div style="font-size:0.75rem; color:var(--text-dim);">Khata No: ${escapeHtml(p.khata_no || '-')} | Ration Card: ${escapeHtml(p.ration_card_no || '-')}</div>
        </div>
        <div style="background:var(--bg-surface-elevated); padding:0.75rem; border-radius:6px; border:1px solid var(--border-subtle);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Total Udhar Pending:</div>
          <div class="font-tabular" style="font-weight:800; font-size:1.15rem; color:${pending > 0 ? 'var(--expense)' : 'var(--revenue)'};">
            ${formatINR(pending)}
          </div>
          ${cleanPhone.length >= 10 && pending > 0 ? `
            <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${p.name}, your pending balance at Gram Panchayat e-Gram Center is ₹${(pending/100).toFixed(2)}. Please arrange for settlement.`)}" target="_blank" class="btn btn-outline btn-sm" style="margin-top:0.4rem; padding:0.25rem 0.5rem; font-size:0.725rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span>Send WhatsApp Reminder</span>
            </a>
          ` : ''}
        </div>
      </div>

      <div style="margin-bottom:1rem;">
        <h4 style="font-size:0.875rem; font-weight:700; margin-bottom:0.4rem;">Service Applications History</h4>
        ${workRows}
      </div>
    `;

    const actionsSlot = document.getElementById('person-detail-actions-slot');
    if (actionsSlot) {
      actionsSlot.innerHTML = `
        <button class="btn btn-outline btn-sm btn-edit-citizen-detail" style="display:inline-flex; align-items:center; gap:0.35rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Edit Profile</span>
        </button>
        <button class="btn btn-outline btn-sm btn-delete-citizen-detail" style="display:inline-flex; align-items:center; gap:0.35rem; color:var(--expense);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>Delete</span>
        </button>
      `;
      actionsSlot.querySelector('.btn-edit-citizen-detail')?.addEventListener('click', () => {
        openEditPersonModal(p.id);
      });
      actionsSlot.querySelector('.btn-delete-citizen-detail')?.addEventListener('click', () => {
        deletePerson(p.id);
      });
    }

    const detailModal = document.getElementById('modal-person-detail');
    detailModal.classList.add('open');
    detailModal.classList.add('active');
  } catch (err) {
    console.error(err);
    notify.error('Failed to load citizen ledger');
  }
}

async function openEditPersonModal(personId) {
  let p = allCitizens.find(c => String(c.id) === String(personId));
  if (!p) {
    try {
      p = await api.get(`/people/${personId}`);
    } catch (e) {
      notify.error('Could not load citizen details');
      return;
    }
  }

  const detailModal = document.getElementById('modal-person-detail');
  if (detailModal) {
    detailModal.classList.remove('open');
    detailModal.classList.remove('active');
  }

  document.getElementById('modal-edit-person-page')?.remove();
  document.body.style.overflow = 'hidden';

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open active';
  modalBackdrop.id = 'modal-edit-person-page';
  modalBackdrop.style.zIndex = '100';
  modalBackdrop.innerHTML = `
    <div class="modal-dialog" style="max-width:520px;">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:1.1rem;">✏️</span>
          <h3 class="modal-title">Edit Citizen Profile</h3>
        </div>
        <button class="modal-close" id="btn-close-edit-p-modal">&times;</button>
      </div>
      <form id="edit-person-form">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="edit-p-name" class="form-control" value="${escapeHtml(p.name || '')}" required />
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Mobile Number</label>
              <input type="tel" id="edit-p-phone" class="form-control" value="${escapeHtml(p.phone || '')}" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Citizen Type</label>
              <select id="edit-p-type" class="form-select">
                <option value="Farmer" ${p.citizen_type === 'Farmer' ? 'selected' : ''}>Farmer</option>
                <option value="General" ${p.citizen_type === 'General' ? 'selected' : ''}>General Citizen</option>
                <option value="Pensioner" ${p.citizen_type === 'Pensioner' ? 'selected' : ''}>Pensioner</option>
                <option value="Student" ${p.citizen_type === 'Student' ? 'selected' : ''}>Student</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Village / Locality</label>
              <input type="text" id="edit-p-village" class="form-control" value="${escapeHtml(p.village || '')}" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Land Khata No.</label>
              <input type="text" id="edit-p-khata" class="form-control" value="${escapeHtml(p.khata_no || '')}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Ration Card No.</label>
              <input type="text" id="edit-p-ration" class="form-control" value="${escapeHtml(p.ration_card_no || '')}" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Aadhaar (Last 4 Digits)</label>
              <input type="text" id="edit-p-aadhaar" class="form-control" maxlength="4" value="${escapeHtml(p.aadhaar_last4 || '')}" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Notes</label>
            <textarea id="edit-p-notes" class="form-control" rows="2">${escapeHtml(p.notes || '')}</textarea>
          </div>
        </div>
        <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
          <button type="button" class="btn btn-outline" id="btn-cancel-edit-p-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" style="font-weight:700;">Update Profile</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  const closeEditModal = () => {
    closeModalAnimated(modalBackdrop, () => modalBackdrop.remove());
  };

  document.getElementById('btn-close-edit-p-modal').addEventListener('click', closeEditModal);
  document.getElementById('btn-cancel-edit-p-modal').addEventListener('click', closeEditModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeEditModal();
  });

  document.getElementById('edit-person-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl = document.getElementById('edit-p-name');
    if (!nameEl.value.trim()) {
      shakeInput(nameEl);
      return;
    }
    const payload = {
      name: nameEl.value.trim(),
      phone: document.getElementById('edit-p-phone').value.trim(),
      citizen_type: document.getElementById('edit-p-type').value,
      village: document.getElementById('edit-p-village').value.trim(),
      khata_no: document.getElementById('edit-p-khata').value.trim(),
      ration_card_no: document.getElementById('edit-p-ration').value.trim(),
      aadhaar_last4: document.getElementById('edit-p-aadhaar').value.trim(),
      notes: document.getElementById('edit-p-notes').value.trim()
    };

    try {
      await api.put(`/people/${personId}`, payload);
      closeEditModal();
      notify.success('Citizen details updated successfully!');
      loadPeople();
    } catch (err) {
      notify.error('Failed to update citizen: ' + err.message);
    }
  });
}

async function deletePerson(personId) {
  const p = allCitizens.find(c => String(c.id) === String(personId));
  const name = p ? p.name : 'this citizen';
  const pending = p ? (p.total_pending || 0) : 0;
  const workCount = p ? (p.work_count || 0) : 0;

  let msg = `Are you sure you want to remove citizen "${name}"?`;
  if (workCount > 0 || pending > 0) {
    msg += `\n\n⚠️ This citizen has ${workCount} application(s) and ₹${(pending/100).toFixed(2)} in balance.\n\nClick OK to delete this citizen and all associated records.`;
  }

  if (!confirm(msg)) return;

  try {
    await api.delete(`/people/${personId}?cascade=true`);
    notify.success(`Citizen "${name}" removed successfully.`);
    const detailModal = document.getElementById('modal-person-detail');
    if (detailModal) {
      closeModalAnimated(detailModal);
    }
    const rowEl = document.querySelector(`tr[data-person-id="${personId}"]`) ||
                  document.querySelector(`.mobile-card[data-person-id="${personId}"]`);
    if (rowEl) {
      animateRowRemoval(rowEl, () => {
        loadPeople();
      });
    } else {
      loadPeople();
    }
  } catch (err) {
    notify.error('Failed to remove citizen: ' + err.message);
  }
}

function openAddPersonModal() {
  document.getElementById('modal-add-person-page')?.remove();
  document.body.style.overflow = 'hidden';

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open';
  modalBackdrop.id = 'modal-add-person-page';
  modalBackdrop.innerHTML = `
    <div class="modal-dialog" style="max-width:520px;">
      <div class="modal-header">
        <h3 class="modal-title">Register New Citizen</h3>
        <button class="modal-close" id="btn-close-p-modal">&times;</button>
      </div>
      <form id="add-person-form">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="input-p-name" class="form-control" placeholder="e.g. Rameshbhai Patel" required />
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Mobile Number</label>
              <input type="tel" id="input-p-phone" class="form-control" placeholder="9825012345" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Citizen Type</label>
              <select id="input-p-type" class="form-select">
                <option value="Farmer" selected>Farmer</option>
                <option value="General">General Citizen</option>
                <option value="Pensioner">Pensioner</option>
                <option value="Student">Student</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Village / Locality</label>
              <input type="text" id="input-p-village" class="form-control" placeholder="e.g. Mota Faliya or Chikhodra" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Land Khata No.</label>
              <input type="text" id="input-p-khata" class="form-control" placeholder="7/12 Khata Number" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Ration Card No.</label>
              <input type="text" id="input-p-ration" class="form-control" placeholder="Ration Card No." />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Aadhaar (Last 4 Digits)</label>
              <input type="text" id="input-p-aadhaar" class="form-control" maxlength="4" placeholder="XXXX" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea id="input-p-notes" class="form-control" rows="2" placeholder="Additional details..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-p-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" style="background:#f97316; border:none; font-weight:700;">
            Save Citizen
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  document.getElementById('btn-close-p-modal').addEventListener('click', closePersonModal);
  document.getElementById('btn-cancel-p-modal').addEventListener('click', closePersonModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closePersonModal();
  });

  document.getElementById('add-person-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl = document.getElementById('input-p-name');
    if (!nameEl.value.trim()) {
      shakeInput(nameEl);
      return;
    }
    const payload = {
      name: nameEl.value.trim(),
      phone: document.getElementById('input-p-phone').value.trim() || null,
      village: document.getElementById('input-p-village').value.trim() || '',
      citizen_type: document.getElementById('input-p-type').value,
      khata_no: document.getElementById('input-p-khata').value.trim() || '',
      ration_card_no: document.getElementById('input-p-ration').value.trim() || '',
      aadhaar_last4: document.getElementById('input-p-aadhaar').value.trim() || '',
      notes: document.getElementById('input-p-notes').value.trim()
    };

    try {
      await api.post('/people', payload);
      closePersonModal();
      notify.success('Citizen registered successfully!');
      loadPeople();
    } catch (err) {
      notify.error('Error creating citizen: ' + err.message);
    }
  });
}

function closePersonModal() {
  const modal = document.getElementById('modal-add-person-page');
  if (modal) {
    closeModalAnimated(modal, () => modal.remove());
  } else {
    document.body.style.overflow = '';
  }
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
