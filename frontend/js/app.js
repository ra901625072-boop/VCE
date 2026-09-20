/**
 * Application Shell Controller & Quick Entry Modals — VCE Pali
 * Minimal UI System, Light/Dark Mode Manager, and Authentic e-Gram Workflows
 */
import { api, rupeesToPaise, getTodayDateStr, getCurrentTimeStr } from './api.js';
import { auth } from './auth.js';
import { notify } from '../components/notification.js';
import { Modal } from '../components/modal.js';
import { renderNavigation } from '../components/sidebar.js';

class ThemeManager {
  constructor() {
    this.themeKey = 'vce_theme';
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.themeKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = saved || (prefersDark ? 'dark' : 'light');
    this.applyTheme(initialTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.themeKey, theme);
    this.updateToggleButtons(theme);
    window.dispatchEvent(new CustomEvent('vce:theme-change', { detail: { theme } }));
  }

  setTheme(theme) {
    this.applyTheme(theme);
  }

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
    notify.info(next === 'light' ? 'Light Mode enabled' : 'Dark Mode enabled');
  }

  updateToggleButtons(theme) {
    const isLight = theme === 'light';
    const icon = isLight ? '🌙' : '☀️';
    const text = isLight ? 'Dark' : 'Light';
    const title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';

    document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
      btn.title = title;
      const textEl = btn.querySelector('.theme-text');
      if (textEl) textEl.textContent = text;
      if (btn.querySelector('.sun-icon')) {
        // Icon visibility handled via CSS classes
        return;
      }
      const iconEl = btn.querySelector('.theme-icon');
      if (iconEl) iconEl.textContent = icon;
      if (!iconEl && !textEl) btn.textContent = `${icon} ${text}`;
    });
  }
}

export const themeManager = new ThemeManager();
window.ThemeManager = themeManager;

class AppController {
  constructor() {
    // Enforce 8-hour duty session authentication guard
    auth.requireAuth();

    this.activePage = document.body.dataset.page || 'dashboard';
    this.init();
  }

  init() {
    this.detectAndApplyNativeApp();
    renderNavigation(this.activePage);
    this.injectQuickModals();
    this.bindThemeToggles();
    this.bindGlobalEvents();
    this.initSessionWatchdog();
  }

  detectAndApplyNativeApp() {
    const isNative = typeof window.AndroidBridge !== 'undefined' ||
                     navigator.userAgent.includes('VCE-Android-Native') ||
                     window.location.search.includes('native=true') ||
                     document.documentElement.classList.contains('is-native-app');
    if (isNative) {
      document.documentElement.classList.add('is-native-app');
      document.querySelectorAll('.apk-download-option, #card-apk-distribution, [href*="/download/apk"], [download*=".apk"]').forEach(el => el.remove());
    }
  }

  initSessionWatchdog() {
    const updateTimer = () => {
      if (auth.isSessionExpired()) {
        notify.warning('Your 8-hour duty shift has concluded. Signing out...');
        setTimeout(() => {
          auth.logout();
        }, 1500);
        return;
      }
      const el = document.getElementById('sidebar-shift-status');
      if (el) {
        el.textContent = `Shift: ${auth.getTimeRemainingFormatted()}`;
      }
    };

    // Update shift timer every 30 seconds
    setInterval(updateTimer, 30000);
  }

  bindThemeToggles() {
    document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        themeManager.toggle();
      });
    });
  }

  injectQuickModals() {
    const container = document.createElement('div');
    container.id = 'quick-modals-root';
    container.innerHTML = `
      <!-- Quick Selector Modal -->
      <div class="modal-backdrop" id="modal-quick-select">
        <div class="modal-dialog" style="max-width: 460px;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.1rem;">⚡</span>
              <h3 class="card-title" style="margin:0; font-size:0.95rem;">Quick Action</h3>
            </div>
            <button class="btn btn-outline btn-sm btn-icon" data-dismiss="modal" aria-label="Close">✕</button>
          </div>
          <div class="modal-body" style="padding:1.15rem;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <!-- Action: Application (Work) -->
              <button class="qa-card-btn" id="qa-btn-work">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div class="qa-icon-wrap" style="color:var(--accent-light);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  </div>
                  <span class="nav-kbd-hint">W</span>
                </div>
                <div>
                  <div class="qa-btn-title">New Application</div>
                  <div class="qa-btn-desc">Issue service token</div>
                </div>
              </button>

              <!-- Action: Receipt / Payment -->
              <button class="qa-card-btn" id="qa-btn-payment">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div class="qa-icon-wrap" style="color:var(--revenue-light);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <span class="nav-kbd-hint">P</span>
                </div>
                <div>
                  <div class="qa-btn-title">Record Payment</div>
                  <div class="qa-btn-desc">Cash or online fee receipt</div>
                </div>
              </button>

              <!-- Action: Center Expense -->
              <button class="qa-card-btn" id="qa-btn-expense">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div class="qa-icon-wrap" style="color:var(--expense-light);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <span class="nav-kbd-hint">E</span>
                </div>
                <div>
                  <div class="qa-btn-title">Log Expense</div>
                  <div class="qa-btn-desc">Paper, toner, internet</div>
                </div>
              </button>

              <!-- Action: Citizen / Farmer -->
              <button class="qa-card-btn" id="qa-btn-person">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div class="qa-icon-wrap" style="color:var(--text-secondary);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <span class="nav-kbd-hint">C</span>
                </div>
                <div>
                  <div class="qa-btn-title">Add Citizen</div>
                  <div class="qa-btn-desc">Resident directory & khata</div>
                </div>
              </button>
            </div>
          </div>
          <div class="modal-footer" style="justify-content:space-between; font-size:0.75rem; color:var(--text-dim);">
            <span class="desktop-shortcut-hint">Press <strong>?</strong> for keyboard shortcuts</span>
            <button type="button" class="btn btn-outline btn-sm" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>

      <!-- Add Citizen / Farmer Modal -->
      <div class="modal-backdrop" id="modal-add-person">
        <div class="modal-dialog" style="max-width:560px;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.1rem;">👤</span>
              <h3 class="card-title">Register Citizen</h3>
            </div>
            <button class="btn btn-outline btn-sm btn-icon" data-dismiss="modal">✕</button>
          </div>
          <form id="form-quick-person">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group" style="flex:2;">
                  <label class="form-label">Full Name *</label>
                  <input type="text" name="name" class="form-control" required placeholder="e.g. Rameshbhai Somabhai Patel" />
                </div>
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Mobile Number</label>
                  <input type="tel" name="phone" class="form-control font-tabular" placeholder="+91 98250 12345" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Village / Ward</label>
                  <input type="text" name="village" class="form-control" placeholder="e.g. Mota Faliya" />
                </div>
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select name="citizen_type" class="form-select">
                    <option value="Farmer" selected>Farmer</option>
                    <option value="Pensioner">Pensioner</option>
                    <option value="Student">Student</option>
                    <option value="General">General Citizen</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Land Khata No.</label>
                  <input type="text" name="khata_no" class="form-control font-tabular" placeholder="e.g. 142" />
                </div>
                <div class="form-group">
                  <label class="form-label">Ration Card No.</label>
                  <input type="text" name="ration_card_no" class="form-control font-tabular" placeholder="e.g. 070401200341" />
                </div>
                <div class="form-group">
                  <label class="form-label">Aadhaar Last 4</label>
                  <input type="text" name="aadhaar_last4" maxlength="4" class="form-control font-tabular" placeholder="e.g. 5812" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Notes</label>
                <textarea name="notes" class="form-control" rows="2" placeholder="Farming, pension, or service notes..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" data-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Citizen</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Application (Work) Modal -->
      <div class="modal-backdrop" id="modal-add-work">
        <div class="modal-dialog" style="max-width:600px;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.1rem;">📝</span>
              <h3 class="card-title">New Service Application</h3>
            </div>
            <button class="btn btn-outline btn-sm btn-icon" data-dismiss="modal">✕</button>
          </div>
          <form id="form-quick-work">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Citizen / Applicant *</label>
                <select name="person_id" id="qw-person-select" class="form-select" required>
                  <option value="">Loading citizens...</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Service Title *</label>
                <input type="text" name="title" id="qw-service-title" class="form-control" required placeholder="e.g. 7/12 & 8-A Land Record Copy" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Service Category</label>
                  <select name="category" id="qw-category-select" class="form-select">
                    <option value="AnyRoR Land Records (7/12 & 8-A)">AnyRoR Land Records (7/12 & 8-A)</option>
                    <option value="Digital Gujarat Certificates">Digital Gujarat Certificates</option>
                    <option value="Farmer & iKhedut / PM-Kisan">Farmer & iKhedut / PM-Kisan</option>
                    <option value="Civil Supplies & Ration Card">Civil Supplies & Ration Card</option>
                    <option value="Panchayat & Civic Services">Panchayat & Civic Services</option>
                    <option value="Identity & Ayushman Card">Identity & Ayushman Card</option>
                    <option value="Utility Bills & CSC Services">Utility Bills & CSC Services</option>
                    <option value="State Dept Work Orders (₹20/Unit)">State Dept Work Orders (₹20/Unit)</option>
                    <option value="General Digital Services">General Digital Services</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Portal Name</label>
                  <input type="text" name="portal_name" id="qw-portal-name" class="form-control" placeholder="AnyRoR / Digital Gujarat / iKhedut / CSC" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Total Fee (₹) *</label>
                  <input type="number" step="0.01" min="0" name="agreed_amount" id="qw-fee-total" class="form-control font-tabular" required placeholder="25.00" />
                </div>
                <div class="form-group">
                  <label class="form-label">Portal Cost (₹)</label>
                  <input type="number" step="0.01" min="0" name="portal_cost" id="qw-fee-portal" class="form-control font-tabular" placeholder="5.00" />
                </div>
                <div class="form-group">
                  <label class="form-label">Panchayat Share (₹)</label>
                  <input type="number" step="0.01" min="0" name="panchayat_share" id="qw-fee-gp" class="form-control font-tabular" placeholder="5.00" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select name="status" class="form-select">
                    <option value="New">New</option>
                    <option value="In Progress" selected>In Progress</option>
                    <option value="Ready / Printed">Ready / Printed</option>
                    <option value="Completed / Delivered">Completed / Delivered</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Target Delivery Date</label>
                  <input type="date" name="deadline" class="form-control" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Application Details / Portal Ref</label>
                <textarea name="description" class="form-control" rows="2" placeholder="e.g. AnyRoR application ack number or notes..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" data-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Application</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Record Payment Modal -->
      <div class="modal-backdrop" id="modal-add-payment">
        <div class="modal-dialog" style="max-width:540px;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.1rem;">💵</span>
              <h3 class="card-title">Record Citizen Payment</h3>
            </div>
            <button class="btn btn-outline btn-sm btn-icon" data-dismiss="modal">✕</button>
          </div>
          <form id="form-quick-payment">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Citizen / Applicant *</label>
                  <select name="person_id" id="qp-person-select" class="form-select" required>
                    <option value="">Select citizen...</option>
                  </select>
                </div>
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Related Application (Optional)</label>
                  <select name="work_id" id="qp-work-select" class="form-select">
                    <option value="">-- Direct / Advance Payment --</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Amount (₹) *</label>
                  <input type="number" step="0.01" min="1" name="amount" class="form-control font-tabular" required placeholder="50.00" />
                </div>
                <div class="form-group">
                  <label class="form-label">Payment Method *</label>
                  <select name="payment_method" id="qp-method-select" class="form-select">
                    <option value="Cash" selected>Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Online">Online NetBanking</option>
                    <option value="Udhar">Udhar (Unpaid Balance)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Date *</label>
                  <input type="date" name="payment_date" id="qp-date" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Time *</label>
                  <input type="time" name="payment_time" id="qp-time" step="1" class="form-control" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Receipt / UTR Reference</label>
                <input type="text" name="transaction_reference" class="form-control font-mono" placeholder="e.g. REC-01 or UPI/2026/0920/123" />
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Notes</label>
                <input type="text" name="notes" class="form-control" placeholder="e.g. 7/12 copy fee paid in cash" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" data-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-success">Record Payment</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Expense Modal -->
      <div class="modal-backdrop" id="modal-add-expense">
        <div class="modal-dialog" style="max-width:540px;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.1rem;">🧾</span>
              <h3 class="card-title">Record Center Expense</h3>
            </div>
            <button class="btn btn-outline btn-sm btn-icon" data-dismiss="modal">✕</button>
          </div>
          <form id="form-quick-expense">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Expense Title *</label>
                <input type="text" name="title" class="form-control" required placeholder="e.g. A4 Paper Box, Toner Refill, Internet" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Amount (₹) *</label>
                  <input type="number" step="0.01" min="1" name="amount" class="form-control font-tabular" required placeholder="350.00" />
                </div>
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select name="category_id" id="qe-category-select" class="form-select">
                    <option value="">General Expense</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Payment Method</label>
                  <select name="payment_method" class="form-select">
                    <option value="Cash" selected>Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Online">Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Vendor / Payee</label>
                  <input type="text" name="vendor" class="form-control" placeholder="e.g. Ambica Stationery, Shreeji Computers" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Date *</label>
                  <input type="date" name="expense_date" id="qe-date" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Time *</label>
                  <input type="time" name="expense_time" id="qe-time" step="1" class="form-control" required />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Bill No. / Notes</label>
                <input type="text" name="notes" class="form-control" placeholder="Voucher reference..." />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" data-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-danger">Save Expense</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Keyboard Shortcuts Modal -->
      <div class="modal-backdrop" id="modal-shortcuts-help">
        <div class="modal-dialog" style="max-width:400px;">
          <div class="modal-header">
            <h3 class="card-title" style="font-size:0.95rem;">Keyboard Shortcuts</h3>
            <button class="btn btn-outline btn-sm btn-icon" data-dismiss="modal">✕</button>
          </div>
          <div class="modal-body" style="padding:1.15rem;">
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid var(--border-subtle);">
                <span style="font-size:0.85rem; color:var(--text-main);">New Application</span>
                <span class="nav-kbd-hint">W</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid var(--border-subtle);">
                <span style="font-size:0.85rem; color:var(--text-main);">Record Payment</span>
                <span class="nav-kbd-hint">P</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid var(--border-subtle);">
                <span style="font-size:0.85rem; color:var(--text-main);">Log Center Expense</span>
                <span class="nav-kbd-hint">E</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid var(--border-subtle);">
                <span style="font-size:0.85rem; color:var(--text-main);">Add Citizen / Resident</span>
                <span class="nav-kbd-hint">C</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0;">
                <span style="font-size:0.85rem; color:var(--text-main);">Shortcuts Help Window</span>
                <span class="nav-kbd-hint">?</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline btn-sm" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    this.selectModal = new Modal('modal-quick-select');
    this.personModal = new Modal('modal-add-person');
    this.workModal = new Modal('modal-add-work');
    this.paymentModal = new Modal('modal-add-payment');
    this.expenseModal = new Modal('modal-add-expense');
    this.helpModal = new Modal('modal-shortcuts-help');

    this.bindQuickModalEvents();
  }

  bindQuickModalEvents() {
    const openQuickSelect = () => this.selectModal.open();
    document.getElementById('btn-quick-add')?.addEventListener('click', openQuickSelect);
    document.getElementById('mobile-btn-quick-add')?.addEventListener('click', openQuickSelect);

    // Quick Select Buttons
    document.getElementById('qa-btn-person')?.addEventListener('click', () => {
      this.selectModal.close();
      this.personModal.open();
    });
    document.getElementById('qa-btn-work')?.addEventListener('click', async () => {
      this.selectModal.close();
      await this.populatePeopleDropdown('qw-person-select');
      this.workModal.open();
    });
    document.getElementById('qa-btn-payment')?.addEventListener('click', async () => {
      this.selectModal.close();
      document.getElementById('qp-date').value = getTodayDateStr();
      document.getElementById('qp-time').value = getCurrentTimeStr();
      await this.populatePeopleDropdown('qp-person-select');
      this.paymentModal.open();
    });
    document.getElementById('qa-btn-expense')?.addEventListener('click', async () => {
      this.selectModal.close();
      document.getElementById('qe-date').value = getTodayDateStr();
      document.getElementById('qe-time').value = getCurrentTimeStr();
      await this.populateExpenseCategoriesDropdown('qe-category-select');
      this.expenseModal.open();
    });

    // Handle Person select change in payment modal
    document.getElementById('qp-person-select')?.addEventListener('change', async (e) => {
      const pId = e.target.value;
      const workSelect = document.getElementById('qp-work-select');
      if (!pId) {
        workSelect.innerHTML = '<option value="">-- Direct / Advance Payment --</option>';
        return;
      }
      try {
        const workItems = await api.get('/work', { person_id: pId });
        workSelect.innerHTML = '<option value="">-- Direct / Advance Payment --</option>' + 
          workItems.map(w => `<option value="${w.id}">${w.title} (Pending: ₹${(w.pending_amount/100).toFixed(2)})</option>`).join('');
      } catch (err) {
        console.error(err);
      }
    });

    // Form Submissions
    document.getElementById('form-quick-person')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim() || null,
        village: form.village.value.trim() || '',
        citizen_type: form.citizen_type.value || 'General',
        khata_no: form.khata_no.value.trim() || '',
        ration_card_no: form.ration_card_no.value.trim() || '',
        aadhaar_last4: form.aadhaar_last4.value.trim() || '',
        notes: form.notes.value.trim() || null,
      };
      try {
        await api.post('/people', data);
        notify.success(`Citizen added: ${data.name}`);
        this.personModal.close();
        form.reset();
        window.dispatchEvent(new CustomEvent('vce:refresh'));
      } catch (err) {
        notify.error(err.message);
      }
    });

    document.getElementById('form-quick-work')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const feeRupees = form.agreed_amount.value || '0';
      const portalRupees = form.portal_cost.value || '0';
      const gpRupees = form.panchayat_share.value || '0';

      const data = {
        person_id: parseInt(form.person_id.value, 10),
        title: form.title.value.trim(),
        category: form.category.value,
        service_category: form.category.value,
        portal_name: form.portal_name.value.trim() || '',
        agreed_amount: rupeesToPaise(feeRupees),
        portal_cost: rupeesToPaise(portalRupees),
        panchayat_share: rupeesToPaise(gpRupees),
        status: form.status.value,
        deadline: form.deadline.value || null,
        description: form.description.value.trim() || null
      };
      try {
        const res = await api.post('/work', data);
        notify.success(`Application created: ${res.token_no || data.title}`);
        this.workModal.close();
        form.reset();
        window.dispatchEvent(new CustomEvent('vce:refresh'));
      } catch (err) {
        notify.error(err.message);
      }
    });

    document.getElementById('form-quick-payment')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        person_id: parseInt(form.person_id.value, 10),
        work_id: form.work_id.value ? parseInt(form.work_id.value, 10) : null,
        amount: rupeesToPaise(form.amount.value),
        payment_method: form.payment_method.value,
        payment_status: 'received',
        payment_date: form.payment_date.value,
        payment_time: form.payment_time.value,
        transaction_reference: form.transaction_reference.value.trim() || null,
        notes: form.notes.value.trim() || null
      };
      try {
        await api.post('/payments', data);
        notify.success(`Payment recorded: ₹${form.amount.value}`);
        this.paymentModal.close();
        form.reset();
        window.dispatchEvent(new CustomEvent('vce:refresh'));
      } catch (err) {
        notify.error(err.message);
      }
    });

    document.getElementById('form-quick-expense')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        title: form.title.value.trim(),
        amount: rupeesToPaise(form.amount.value),
        category_id: form.category_id.value ? parseInt(form.category_id.value, 10) : null,
        payment_method: form.payment_method.value,
        vendor: form.vendor.value.trim() || null,
        expense_date: form.expense_date.value,
        expense_time: form.expense_time.value,
        notes: form.notes.value.trim() || null
      };
      try {
        await api.post('/expenses', data);
        notify.success(`Expense saved: ${data.title}`);
        this.expenseModal.close();
        form.reset();
        window.dispatchEvent(new CustomEvent('vce:refresh'));
      } catch (err) {
        notify.error(err.message);
      }
    });
  }

  async populatePeopleDropdown(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      const people = await api.get('/people');
      if (people.length === 0) {
        el.innerHTML = '<option value="">No citizens registered. Please add a citizen first.</option>';
      } else {
        el.innerHTML = '<option value="">-- Select Citizen --</option>' +
          people.map(p => `<option value="${p.id}">${p.name} ${p.village ? `(${p.village})` : ''} - ${p.citizen_type || 'General'}</option>`).join('');
      }
    } catch (err) {
      el.innerHTML = '<option value="">Error loading citizens</option>';
    }
  }

  async populateExpenseCategoriesDropdown(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      const cats = await api.get('/settings/expense-categories');
      el.innerHTML = '<option value="">-- General Center Expense --</option>' +
        cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (err) {
      console.error(err);
    }
  }

  bindGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const key = e.key.toLowerCase();
      if (key === 'w') {
        e.preventDefault();
        document.getElementById('qa-btn-work')?.click();
      } else if (key === 'p') {
        e.preventDefault();
        document.getElementById('qa-btn-payment')?.click();
      } else if (key === 'e') {
        e.preventDefault();
        document.getElementById('qa-btn-expense')?.click();
      } else if (key === 'c') {
        e.preventDefault();
        document.getElementById('qa-btn-person')?.click();
      } else if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        this.helpModal.open();
      }
    });
  }
}

export const app = new AppController();
