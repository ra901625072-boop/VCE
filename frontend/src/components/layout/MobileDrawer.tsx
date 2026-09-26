import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  Receipt,
  BarChart3,
  Settings,
  Smartphone,
  LogOut,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, shiftRemainingFormatted, logout } = useAuth();

  const isNative =
    typeof (window as any).AndroidBridge !== 'undefined' ||
    navigator.userAgent.includes('VCE-Android-Native') ||
    window.location.search.includes('native=true') ||
    document.documentElement.classList.contains('is-native-app');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard (ડેશબોર્ડ)', icon: <LayoutDashboard size={18} /> },
    { to: '/work', label: 'Applications (અરજીઓ)', icon: <FileText size={18} /> },
    { to: '/citizens', label: 'Citizens & Udhar (નાગરિક ખાતાવહી)', icon: <Users size={18} /> },
    { to: '/rojmel', label: 'Daily Rojmel (દૈનિક રોજમેળ)', icon: <BookOpen size={18} /> },
    { to: '/transactions', label: 'Transactions Journal', icon: <Receipt size={18} /> },
    { to: '/reports', label: 'Reports & Audit (રિપોર્ટ્સ)', icon: <BarChart3 size={18} /> },
    { to: '/settings', label: 'Center Settings (સેટિંગ્સ)', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Scrim Backdrop */}
      <div
        className="mobile-drawer-scrim open"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(3px)',
          zIndex: 1100,
        }}
      />

      {/* Drawer */}
      <aside
        className="sidebar mobile-open open"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '80vw',
          backgroundColor: 'var(--bg-surface)',
          zIndex: 1101,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideInLeft 0.22s ease forwards',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img src="/assets/vce-logo.svg?v=3" alt="Logo" style={{ height: '24px' }} />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', display: 'block' }}>
                Pali e-Gram
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600, display: 'block' }}>
                Mobile Workstation
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm btn-icon"
            style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Links */}
        <nav style={{ padding: '0.85rem 0.65rem', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.25rem',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          {!isNative && (
            <a
              href="/download/apk"
              download="VCE_Pali.apk"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--revenue-light)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginTop: '0.5rem',
                border: '1px dashed rgba(5, 150, 105, 0.4)',
                background: 'rgba(5, 150, 105, 0.08)',
              }}
            >
              <Smartphone size={18} />
              <span>Download Android APK</span>
            </a>
          )}
        </nav>

        {/* Drawer Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {user?.full_name || user?.username || 'VCE Operator'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} />
                <span>Shift: {shiftRemainingFormatted}</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                if (window.confirm('End shift and sign out?')) logout('logged_out');
              }}
              className="btn btn-outline btn-sm btn-icon"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
