/**
 * Navigation Bar & Mobile Off-Canvas Drawer — VCE Pali (e-Gram Center & Financial Ledger)
 * Visual Identity: Official e-Gram Pali Civic Emblem, Unified 2px Stroke Icons & Tactile Micro-Interactions
 * Mobile First: Off-Canvas Drawer, Scrim Backdrop, Responsive Bottom Nav & Thumb Action FAB
 */

import { auth } from '../js/auth.js';

export function renderNavigation(activePage = 'dashboard') {
  const isNative = typeof window.AndroidBridge !== 'undefined' ||
                   navigator.userAgent.includes('VCE-Android-Native') ||
                   window.location.search.includes('native=true') ||
                   document.documentElement.classList.contains('is-native-app');
  if (isNative) {
    document.documentElement.classList.add('is-native-app');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  const user = auth.getUser() || { username: '', full_name: 'VCE Operator', role: 'Operator' };
  const timeRemaining = auth.getTimeRemainingFormatted();

  // Ensure Mobile Drawer Scrim exists
  let scrim = document.getElementById('mobile-drawer-scrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.id = 'mobile-drawer-scrim';
    scrim.className = 'mobile-drawer-scrim';
    document.body.appendChild(scrim);
  }

  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <aside class="sidebar" id="app-sidebar">
        <!-- VCE Pali Civic Brand Mark & Drawer Close for Mobile -->
        <div class="sidebar-brand">
          <div style="display:flex; align-items:center; gap:0.75rem; flex:1; overflow:hidden;">
            <img src="/assets/vce-logo.svg" alt="VCE Logo" style="height:26px; width:auto; object-fit:contain; filter:drop-shadow(0 2px 8px rgba(234,88,12,0.45));" />
            <div style="height:18px; width:1px; background:var(--border-strong);"></div>
            <div class="brand-text-block">
              <span class="brand-title" style="font-size:0.85rem;">Pali</span>
              <span class="brand-subtitle" style="font-size:0.65rem;">e-Gram Center</span>
            </div>
          </div>
          <!-- Close Drawer Button (visible on mobile) -->
          <button class="btn btn-outline btn-sm btn-icon" id="btn-close-drawer" aria-label="Close Navigation Menu" style="display:none; color:var(--text-muted); border-color:transparent; padding:0.35rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <div class="nav-section-title">Overview</div>
          <a href="/pages/dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
              <span>Dashboard (ડેશબોર્ડ)</span>
            </div>
          </a>

          <div class="nav-section-title" style="margin-top:0.6rem;">Services & Citizens</div>
          <a href="/pages/work.html" class="nav-item ${activePage === 'work' ? 'active' : ''}">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              <span>Applications (અરજીઓ)</span>
            </div>
            <span class="nav-kbd-hint">W</span>
          </a>

          <a href="/pages/people.html" class="nav-item ${activePage === 'people' ? 'active' : ''}">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Citizens & Udhar (નાગરિક ખાતાવહી)</span>
            </div>
            <span class="nav-kbd-hint">C</span>
          </a>

          <div class="nav-section-title" style="margin-top:0.6rem;">Daily Financials</div>
          <a href="/pages/rojmel.html" class="nav-item ${activePage === 'rojmel' ? 'active' : ''}">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>Daily Rojmel (દૈનિક રોજમેળ)</span>
            </div>
            <span class="nav-kbd-hint">R</span>
          </a>

          <a href="/pages/transactions.html" class="nav-item ${activePage === 'transactions' ? 'active' : ''}">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>Transactions Journal</span>
            </div>
            <span class="nav-kbd-hint">P</span>
          </a>

          <div class="nav-section-title" style="margin-top:0.6rem;">Reports & Admin</div>
          <a href="/pages/reports.html" class="nav-item ${activePage === 'reports' ? 'active' : ''}">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Reports & Audit (રિપોર્ટ્સ)</span>
            </div>
          </a>

          <a href="/pages/settings.html" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Center Settings (સેટિંગ્સ)</span>
            </div>
          </a>

          ${!isNative ? `
          <a href="/download/apk" class="nav-item apk-download-option" download="VCE_Pali.apk" title="Download Android App (APK v1.0.0)">
            <div class="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              <span>Android App (APK ડાઉનલોડ)</span>
            </div>
            <span class="nav-rate-badge" style="background:rgba(5,150,105,0.15); color:var(--revenue); font-weight:700; border:1px solid rgba(5,150,105,0.3); font-size:0.68rem; padding:0.1rem 0.35rem; border-radius:var(--radius-xs);">v1.0</span>
          </a>` : ''}
        </nav>

        <!-- Sidebar Footer: Quick Action & Operator Session Card -->
        <div class="sidebar-footer" style="display:flex; flex-direction:column; gap:0.65rem;">
          <button class="btn btn-outline" id="btn-quick-add" style="width:100%; justify-content:space-between; border-color:var(--border-default); background:var(--bg-surface);">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span style="font-weight:700; color:var(--text-main);">Quick Entry</span>
            </div>
            <span class="nav-kbd-hint">?</span>
          </button>

          <!-- Operator Duty Session Badge -->
          <div style="padding:0.6rem 0.75rem; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.55rem; overflow:hidden;">
              <div style="width:28px; height:28px; border-radius:50%; background:rgba(194,65,12,0.15); border:1px solid rgba(194,65,12,0.3); color:var(--accent); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">
                ${((user.full_name || user.username || 'VCE Operator')[0] || 'V').toUpperCase()}
              </div>
              <div style="overflow:hidden;">
                <div style="font-size:0.775rem; font-weight:700; color:var(--text-main); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="${user.full_name || user.username || 'VCE Operator'}">
                  ${user.full_name || user.username || 'VCE Operator'}
                </div>
                <div style="font-size:0.65rem; color:var(--accent); font-weight:600; display:flex; align-items:center; gap:0.25rem;">
                  <span style="width:5px; height:5px; border-radius:50%; background:var(--revenue); display:inline-block;"></span>
                  <span id="sidebar-shift-status">Shift: ${timeRemaining}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-outline btn-sm btn-icon" id="btn-sidebar-logout" title="Sign Out of e-Gram Workstation" aria-label="Sign Out" style="color:var(--text-muted); border-color:transparent; padding:0.3rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>
    `;

    // Bind logout button click
    const btnLogout = document.getElementById('btn-sidebar-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to end your current e-Gram duty shift and sign out?')) {
          auth.logout();
        }
      });
    }

    // Bind Close Drawer button inside sidebar
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', () => closeMobileDrawer());
    }
  }

  // Prepend Mobile Hamburger Toggle to topbar-left if not already present
  const topbarLeft = document.querySelector('.topbar-left');
  if (topbarLeft && !document.getElementById('btn-mobile-drawer-toggle')) {
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.id = 'btn-mobile-drawer-toggle';
    hamburgerBtn.className = 'btn-mobile-hamburger';
    hamburgerBtn.title = 'Open Menu';
    hamburgerBtn.setAttribute('aria-label', 'Open Navigation Drawer');
    hamburgerBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    topbarLeft.insertBefore(hamburgerBtn, topbarLeft.firstChild);

    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileDrawer();
    });
  }

  // Drawer event helpers
  function openMobileDrawer() {
    const sidebar = document.getElementById('app-sidebar');
    const scrimEl = document.getElementById('mobile-drawer-scrim');
    const closeBtn = document.getElementById('btn-close-drawer');
    if (sidebar) {
      sidebar.classList.add('open');
      sidebar.classList.add('mobile-open');
    }
    if (scrimEl) scrimEl.classList.add('open');
    if (closeBtn) closeBtn.style.display = 'inline-flex';
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    const sidebar = document.getElementById('app-sidebar');
    const scrimEl = document.getElementById('mobile-drawer-scrim');
    const closeBtn = document.getElementById('btn-close-drawer');
    if (sidebar) {
      sidebar.classList.remove('open');
      sidebar.classList.remove('mobile-open');
    }
    if (scrimEl) scrimEl.classList.remove('open');
    if (closeBtn) closeBtn.style.display = 'none';
    document.body.style.overflow = '';
  }

  function toggleMobileDrawer() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && (sidebar.classList.contains('open') || sidebar.classList.contains('mobile-open'))) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  }

  // Scrim click to dismiss drawer
  if (scrim) {
    scrim.addEventListener('click', closeMobileDrawer);
  }

  // Escape key to dismiss drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileDrawer();
    }
  });

  // Close drawer on clicking any navigation link
  document.querySelectorAll('#app-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMobileDrawer();
      }
    });
  });

  // Mobile bottom bar with safe-area ergonomics & 4 primary tabs + center FAB
  const mobileNavContainer = document.getElementById('mobile-bottom-nav-container');
  if (mobileNavContainer) {
    mobileNavContainer.innerHTML = `
      <nav class="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        <a href="/pages/dashboard.html" class="mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
          <span>Home</span>
        </a>
        <a href="/pages/work.html" class="mobile-nav-item ${activePage === 'work' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          <span>Work</span>
        </a>
        <button class="mobile-nav-fab" id="mobile-btn-quick-add" aria-label="Quick Action Trigger" title="New Entry">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <a href="/pages/rojmel.html" class="mobile-nav-item ${activePage === 'rojmel' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>Rojmel</span>
        </a>
        <a href="/pages/people.html" class="mobile-nav-item ${activePage === 'people' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Citizens</span>
        </a>
      </nav>
    `;
  }
}
