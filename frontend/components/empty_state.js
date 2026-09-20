/**
 * Technical & Illustrated Empty States — VCE Pali e-Gram Center & Ledger
 * Handcrafted vector SVG illustrations with civic e-Governance motifs
 */

export const EmptyState = {
  work(actionCallbackId = "qa-btn-work") {
    return `
      <div class="empty-state-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3.5rem 1.5rem; text-align:center;">
        <div style="width:72px; height:72px; margin-bottom:1.25rem; border-radius:var(--radius-md); background:var(--bg-surface-elevated); border:1px solid var(--border-default); display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);">
          <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
            <rect x="10" y="8" width="28" height="34" rx="3" fill="rgba(234, 88, 12, 0.08)" stroke="var(--accent)" stroke-width="2"/>
            <path d="M16 16h16M16 22h16M16 28h10" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="33" cy="31" r="5" fill="var(--bg-surface)" stroke="var(--revenue)" stroke-width="2"/>
            <path d="M31 31l1.5 1.5 3-3" stroke="var(--revenue)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div style="font-family:var(--font-display); font-size:1rem; font-weight:700; color:var(--text-main); margin-bottom:0.35rem;">No Applications Registered</div>
        <p style="font-size:0.825rem; color:var(--text-muted); max-width:380px; margin-bottom:1.25rem; line-height:1.5;">
          Issue citizen tokens for AnyRoR 7/12 land records, Digital Gujarat certificates, or government scheme applications.
        </p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('${actionCallbackId}')?.click()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>New Application</span>
        </button>
      </div>
    `;
  },

  transactions(actionCallbackId = "qa-btn-payment") {
    return `
      <div class="empty-state-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3.5rem 1.5rem; text-align:center;">
        <div style="width:72px; height:72px; margin-bottom:1.25rem; border-radius:var(--radius-md); background:var(--bg-surface-elevated); border:1px solid var(--border-default); display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);">
          <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="10" width="32" height="28" rx="3" fill="rgba(16, 185, 129, 0.08)" stroke="var(--border-strong)" stroke-width="2"/>
            <path d="M8 18h32" stroke="var(--border-strong)" stroke-width="1.5"/>
            <circle cx="24" cy="28" r="7" fill="var(--bg-surface)" stroke="var(--revenue)" stroke-width="2"/>
            <text x="24" y="32" font-family="var(--font-mono)" font-size="10" font-weight="bold" fill="var(--revenue)" text-anchor="middle">₹</text>
          </svg>
        </div>
        <div style="font-family:var(--font-display); font-size:1rem; font-weight:700; color:var(--text-main); margin-bottom:0.35rem;">No Ledger Transactions Recorded</div>
        <p style="font-size:0.825rem; color:var(--text-muted); max-width:380px; margin-bottom:1.25rem; line-height:1.5;">
          Capture citizen service fees (Cash/UPI) or record center expenses for paper, toner, and utilities.
        </p>
        <div style="display:flex; gap:0.65rem;">
          <button class="btn btn-success btn-sm" onclick="document.getElementById('${actionCallbackId}')?.click()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Record Receipt</span>
          </button>
          <button class="btn btn-danger btn-sm" onclick="document.getElementById('qa-btn-expense')?.click()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Log Expense</span>
          </button>
        </div>
      </div>
    `;
  },

  people(actionCallbackId = "qa-btn-person") {
    return `
      <div class="empty-state-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3.5rem 1.5rem; text-align:center;">
        <div style="width:72px; height:72px; margin-bottom:1.25rem; border-radius:var(--radius-md); background:var(--bg-surface-elevated); border:1px solid var(--border-default); display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);">
          <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="16" r="6" stroke="var(--accent)" stroke-width="2" fill="rgba(234, 88, 12, 0.1)"/>
            <path d="M12 36c0-6 5-9 12-9s12 3 12 9" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="34" cy="18" r="4" stroke="var(--text-muted)" stroke-width="1.5"/>
            <path d="M35 27c4 1 6 3 6 7" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="font-family:var(--font-display); font-size:1rem; font-weight:700; color:var(--text-main); margin-bottom:0.35rem;">No Citizens in Ledger</div>
        <p style="font-size:0.825rem; color:var(--text-muted); max-width:380px; margin-bottom:1.25rem; line-height:1.5;">
          Add village residents and farmers to manage application histories and village Udhar accounts.
        </p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('${actionCallbackId}')?.click()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add Citizen</span>
        </button>
      </div>
    `;
  }
};
