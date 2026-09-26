import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onOpenQuickEntry: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickEntry }) => {
  const { user, shiftRemainingFormatted, logout } = useAuth();

  const isNative =
    typeof (window as any).AndroidBridge !== 'undefined' ||
    navigator.userAgent.includes('VCE-Android-Native') ||
    window.location.search.includes('native=true') ||
    document.documentElement.classList.contains('is-native-app');

  return (
    <aside className="sidebar" id="app-sidebar">
      {/* VCE Pali Civic Brand Mark */}
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
          <img
            src="/assets/vce-logo.svg?v=3"
            alt="VCE Logo"
            style={{
              height: '26px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(234,88,12,0.45))',
            }}
          />
          <div style={{ height: '18px', width: '1px', background: 'var(--border-strong)' }} />
          <div className="brand-text-block">
            <span className="brand-title" style={{ fontSize: '0.85rem' }}>Pali</span>
            <span className="brand-subtitle" style={{ fontSize: '0.65rem' }}>e-Gram Center</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {/* Section: Overview */}
        <div className="nav-section-title">Overview</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Dashboard (ડેશબોર્ડ)</span>
          </div>
        </NavLink>

        {/* Section: Services & Citizens */}
        <div className="nav-section-title" style={{ marginTop: '0.6rem' }}>
          Services &amp; Citizens
        </div>
        <NavLink
          to="/work"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <span>Applications (અરજીઓ)</span>
          </div>
          <span className="nav-kbd-hint">W</span>
        </NavLink>

        <NavLink
          to="/citizens"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Citizens &amp; Udhar (નાગરિક ખાતાવહી)</span>
          </div>
          <span className="nav-kbd-hint">C</span>
        </NavLink>

        {/* Section: Daily Financials */}
        <div className="nav-section-title" style={{ marginTop: '0.6rem' }}>
          Daily Financials
        </div>
        <NavLink
          to="/rojmel"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Daily Rojmel (દૈનિક રોજમેળ)</span>
          </div>
          <span className="nav-kbd-hint">R</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Transactions Journal</span>
          </div>
          <span className="nav-kbd-hint">P</span>
        </NavLink>

        {/* Section: Reports & Admin */}
        <div className="nav-section-title" style={{ marginTop: '0.6rem' }}>
          Reports &amp; Admin
        </div>
        <NavLink
          to="/reports"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Reports &amp; Audit (રિપોર્ટ્સ)</span>
          </div>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Center Settings (સેટિંગ્સ)</span>
          </div>
        </NavLink>

        {!isNative && (
          <a
            href="/download/apk"
            className="nav-item apk-download-option"
            download="VCE_Pali.apk"
            title="Download Android App (APK v1.1.0)"
          >
            <div className="nav-item-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span>Android App (APK ડાઉનલોડ)</span>
            </div>
            <span
              style={{
                background: 'rgba(5,150,105,0.15)',
                color: 'var(--revenue)',
                fontWeight: 700,
                border: '1px solid rgba(5,150,105,0.3)',
                fontSize: '0.68rem',
                padding: '0.1rem 0.35rem',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              v1.1
            </span>
          </a>
        )}
      </nav>

      {/* Sidebar Footer: Quick Action & Operator Session Card */}
      <div className="sidebar-footer">
        <button
          className="btn btn-outline"
          id="btn-quick-add"
          onClick={onOpenQuickEntry}
          type="button"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            borderColor: 'var(--border-default)',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Quick Entry</span>
          </div>
          <span className="nav-kbd-hint">?</span>
        </button>

        {/* Operator Duty Session Badge */}
        <div
          style={{
            padding: '0.6rem 0.75rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(194,65,12,0.15)',
                border: '1px solid rgba(194,65,12,0.3)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
            >
              {((user?.full_name || user?.username || 'VCE Operator')[0] || 'V').toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
                title={user?.full_name || user?.username || 'VCE Operator'}
              >
                {user?.full_name || user?.username || 'VCE Operator'}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: 'var(--revenue)',
                    display: 'inline-block',
                  }}
                />
                <span id="sidebar-shift-status">Shift: {shiftRemainingFormatted}</span>
              </div>
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm btn-icon"
            id="btn-sidebar-logout"
            title="Sign Out of e-Gram Workstation"
            aria-label="Sign Out"
            onClick={() => {
              if (window.confirm('Are you sure you want to end your shift and sign out?')) {
                logout('logged_out');
              }
            }}
            type="button"
            style={{ color: 'var(--text-muted)', borderColor: 'transparent', padding: '0.3rem' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
