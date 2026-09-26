import React from 'react';
import { Menu } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import { ThemeToggleButton } from '../../context/ThemeContext';

interface TopBarProps {
  onToggleMobileDrawer: () => void;
  title?: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileDrawer,
  title = 'e-Gram Center Dashboard',
  subtitle = 'ગુજરાત સરકાર • પંચાયત, ગ્રામ ગૃહનિર્માણ અને ગ્રામ વિકાસ વિભાગ | e-Gram Vishwagram Project',
  badge,
  children,
}) => {
  const { status, latencyMs } = useConnection();

  const isConnected = status === 'online';
  const isChecking = status === 'checking';

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileDrawer}
          className="btn-mobile-hamburger hide-on-desktop"
          aria-label="Toggle navigation menu"
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '0.4rem',
            marginRight: '0.25rem',
            display: 'none',
          }}
        >
          <Menu size={20} />
        </button>

        <div className="topbar-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="topbar-title">{title}</h1>
            {badge && (
              <span
                className="badge"
                style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.45rem',
                  background: 'rgba(194,65,12,0.1)',
                  color: 'var(--accent)',
                  borderColor: 'rgba(194,65,12,0.25)',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="topbar-right">
        {/* Universal Live Connection Status Pill */}
        <div
          className={`topbar-status-pill ${isConnected ? '' : 'offline'}`}
          title={isConnected ? `Server Connected (${latencyMs ? `${latencyMs}ms` : 'ok'})` : isChecking ? 'Connecting to backend...' : 'Server Offline'}
        >
          <span className="status-dot" />
          <span className="desktop-only-inline">{isConnected ? 'Online' : isChecking ? 'Connecting' : 'Offline'}</span>
        </div>

        {/* Theme Switcher Toggle (1:1 with old HTML UI) */}
        <ThemeToggleButton id="btn-theme-switch-top" />

        {/* Optional page specific header actions */}
        {children}
      </div>
    </header>
  );
};
export default TopBar;
