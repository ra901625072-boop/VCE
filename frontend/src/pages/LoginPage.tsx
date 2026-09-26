import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('akrajput2005');
  const [password, setPassword] = useState('Akshay@05');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('vce_theme') as 'dark' | 'light') || 'dark';
  });

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isNative =
    typeof (window as any).AndroidBridge !== 'undefined' ||
    navigator.userAgent.includes('VCE-Android-Native') ||
    window.location.search.includes('native=true') ||
    document.documentElement.classList.contains('is-native-app');

  // Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vce_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // URL alerts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setAlert({
        message: 'Your previous 8-hour shift session has expired. Please sign in to resume duty.',
        type: 'info',
      });
    } else if (params.get('logged_out') === '1') {
      setAlert({
        message: 'You have been successfully signed out of the e-Gram workstation.',
        type: 'success',
      });
    }
  }, [location.search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setCapsLockActive(e.getModifierState && e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      await login({ username, password });
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err: any) {
      let message = 'Invalid username or password. Please try again.';
      if (typeof err?.message === 'string') {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      } else if (err?.detail && typeof err.detail === 'string') {
        message = err.detail;
      }
      setAlert({
        message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* Top Administrative Navigation Bar */}
      <header className="login-top-bar">
        <div className="brand-group">
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <img
              src="/assets/vce-logo.svg?v=3"
              alt="VCE Pali"
              className="login-brand-logo"
              style={{ height: '32px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(249,115,22,0.4))' }}
            />
            <div style={{ height: '22px', width: '1px', background: 'var(--border-strong)' }} />
            <div>
              <div className="brand-meta-title">
                e-Gram Vishwagram <br className="mobile-only-break" />Project
              </div>
              <div className="brand-meta-sub">ગુજરાત સરકાર • પંચાયત વિભાગ</div>
            </div>
          </a>
        </div>

        <div className="top-controls-group">
          <div className="live-clock-badge" id="live-datetime">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span id="header-time-text">{timeStr || 'Indian Standard Time'}</span>
          </div>

          {!isNative && (
            <a
              href="/download/apk"
              className="btn-theme-toggle apk-download-option"
              download="VCE_Pali.apk"
              title="Download VCE Pali Android APK (v1.1.0)"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.65rem',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                background: 'var(--bg-surface-elevated)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--revenue-light)" stroke-width="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Android App</span>
              <span style={{ background: 'rgba(5,150,105,0.2)', color: 'var(--revenue-light)', fontSize: '0.625rem', padding: '0.05rem 0.3rem', borderRadius: '3px', border: '1px solid rgba(5,150,105,0.35)' }}>
                v1.1
              </span>
            </a>
          )}

          <button
            className="btn-theme-toggle"
            id="btn-theme-switch-login"
            onClick={toggleTheme}
            title="Toggle Light / Dark Mode"
            aria-label="Toggle Theme"
          >
            <span className="theme-icon sun-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="theme-text">Mode</span>
          </button>
        </div>
      </header>

      {/* Main Architectural Workspace Shell */}
      <main className="login-main-container">
        <div className="login-grid-shell">
          {/* Left Column: Civic Identity & Shift Overview */}
          <section className="civic-hero-panel">
            <div>
              {/* Proud VCE Monogram Hero Lockup */}
              <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <img
                  src="/assets/vce-logo.svg?v=3"
                  alt="VCE Monogram Logo"
                  style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 6px 24px rgba(249,115,22,0.45))' }}
                />
                <div className="civic-tag-pill" style={{ marginBottom: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 2L3.5 6.2v5.8c0 5.25 3.65 10.15 8.5 11.5 4.85-1.35 8.5-6.25 8.5-11.5V6.2L12 2z" />
                  </svg>
                  <span>e-Gram Civic Network</span>
                </div>
              </div>

              <h1 className="civic-hero-title">Village Computer Entrepreneur Workstation</h1>
              <div className="civic-hero-gujarati">ઈ-ગ્રામ વિશ્વગ્રામ પ્રોજેક્ટ • ગ્રામ પંચાયત ડિજિટલ સેવા કેન્દ્ર</div>
              <p className="civic-hero-desc">
                Integrated operator console for Citizen G2C applications, Digital Gujarat certifications, 7/12 Land Records, and daily Rojmel double-entry financial accounting.
              </p>

              {/* 3 Highlight Features */}
              <div className="civic-features-stack">
                <div className="civic-feature-item">
                  <div className="feature-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M7 8h10M7 12h10M7 16h6" />
                    </svg>
                  </div>
                  <div className="feature-text-block">
                    <h4>G2C Citizen Service Processing</h4>
                    <p>AnyRoR 7/12 & 8-A, Caste & Income Certificates, iKhedut & PM-Kisan portal operations.</p>
                  </div>
                </div>

                <div className="civic-feature-item">
                  <div className="feature-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="feature-text-block">
                    <h4>8-Hour Shift Session Security</h4>
                    <p>Encrypted operator session tokens. Every transaction is auditable under your active duty shift.</p>
                  </div>
                </div>

                <div className="civic-feature-item">
                  <div className="feature-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div className="feature-text-block">
                    <h4>Daily Rojmel & Cash Reconciliation</h4>
                    <p>Zero-leakage denomination tracking and automated Panchayat share remittance receipts.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="civic-status-bar">
              <div className="status-live-indicator">
                <span className="pulse-dot" />
                <span>e-Gram Portal: Live & Operational</span>
              </div>
              <span>Workstation v2.0</span>
            </div>
          </section>

          {/* Right Column: Operator Terminal Card */}
          <section className="terminal-card">
            <div className="terminal-header">
              <div className="terminal-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>OPERATOR TERMINAL</span>
              </div>
              <h2 className="terminal-title">Operator Sign-In</h2>
              <p className="terminal-subtitle">Sign in with your assigned VCE credentials to initiate your 8-hour duty shift.</p>
            </div>

            <div className="terminal-body">
              {/* Alert Box */}
              {alert && (
                <div className={`login-alert ${alert.type}`} role="alert" style={{ display: 'flex' }}>
                  <span>{alert.type === 'error' ? '❌' : alert.type === 'info' ? '⏳' : '✓'}</span>
                  <span>{alert.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Operator ID Field */}
                <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                  <label className="form-label" htmlFor="username">
                    Operator ID / Username{' '}
                    <span style={{ fontFamily: 'var(--font-gujarati)', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                      (ઓપરેટર આઈડી)
                    </span>
                  </label>
                  <div className="input-field-wrap">
                    <span className="field-lead-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-input-stylish"
                      placeholder="Operator ID"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                      spellCheck="false"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="form-label" htmlFor="current-password" style={{ marginBottom: 0 }}>
                      Password{' '}
                      <span style={{ fontFamily: 'var(--font-gujarati)', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                        (પાસવર્ડ)
                      </span>
                    </label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>SHA-256 Encrypted</span>
                    </span>
                  </div>
                  <div className="input-field-wrap">
                    <span className="field-lead-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="current-password"
                      name="password"
                      className="form-input-stylish"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Show password"
                      title="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {capsLockActive && (
                    <div className="caps-indicator" style={{ display: 'flex' }}>
                      <span>⇪</span> <span>Caps Lock is ON</span>
                    </div>
                  )}
                </div>

                {/* Shift Session Indicator Box */}
                <div className="shift-duty-card">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div>
                    <h5>Shift Session: 8 Hours Active Validity</h5>
                    <p>Your session remains active for 8 hours of active duty. Automatic log-out occurs upon shift expiry.</p>
                  </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn-submit-workstation" disabled={loading}>
                  {loading ? (
                    <div className="btn-loading-spinner" style={{ display: 'inline-block' }} />
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Sign In to Workstation</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </button>

                {/* Fill Quick Credentials */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('akrajput2005');
                      setPassword('Akshay@05');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Fill Operator Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('operator');
                      setPassword('pali1234');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Fill Shift Backup
                  </button>
                </div>
              </form>

              {/* Android App Download Card */}
              {!isNative && (
                <div
                  className="apk-download-option"
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'rgba(194,65,12,0.15)',
                        border: '1px solid rgba(194,65,12,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Android Mobile Workstation
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Direct APK v1.1.0 (15.3 MB)</div>
                    </div>
                  </div>
                  <a
                    href="/download/apk"
                    download="VCE_Pali.apk"
                    className="btn btn-primary btn-sm"
                    style={{
                      textDecoration: 'none',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download APK</span>
                  </a>
                </div>
              )}

              {/* Bottom Support & Legal Notes */}
              <div className="terminal-footer-notes">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Helpline: <strong>1800-233-0101</strong></span>
                </span>
                <span>Govt of Gujarat • IT Act 2000</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
