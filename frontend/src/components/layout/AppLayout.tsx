import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from './MobileDrawer';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickEntryModal } from '../common/QuickEntryModal';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Global Keyboard Shortcuts matching original workstation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.key === '?') {
        e.preventDefault();
        setQuickEntryOpen(true);
      } else if (e.key === 'w' || e.key === 'W') {
        navigate('/work');
      } else if (e.key === 'c' || e.key === 'C') {
        navigate('/citizens');
      } else if (e.key === 'r' || e.key === 'R') {
        navigate('/rojmel');
      } else if (e.key === 'p' || e.key === 'P') {
        navigate('/transactions');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // Derive authentic title and subtitle matching original HTML pages
  const getHeaderInfo = () => {
    const p = location.pathname;
    if (p.includes('/work')) {
      return {
        title: 'Applications & Services',
        subtitle: 'Token tracking, service delivery, and fee collection ledger',
        badge: undefined,
      };
    }
    if (p.includes('/citizens') || p.includes('/people')) {
      return {
        title: 'Citizens & Khata (નાગરિક ખાતાવહી)',
        subtitle: 'Resident records, land khata numbers, and outstanding balance accounts',
        badge: undefined,
      };
    }
    if (p.includes('/rojmel')) {
      return {
        title: 'Daily Rojmel (રોજમેળ)',
        subtitle: 'e-Gram Vishwagram Center — Cash & Digital Daily Tally',
        badge: undefined,
      };
    }
    if (p.includes('/transactions')) {
      return {
        title: 'Transactions & Cash Flow',
        subtitle: 'Receipts, citizen fee settlements, and center expense journal',
        badge: undefined,
      };
    }
    if (p.includes('/reports')) {
      return {
        title: 'Financial Reports (રિપોર્ટ્સ)',
        subtitle: 'Revenue, expenses, P&L statement, village ledger audit, and Taluka claims',
        badge: undefined,
      };
    }
    if (p.includes('/settings')) {
      return {
        title: 'Settings (સેટિંગ્સ)',
        subtitle: 'Gram Panchayat profile, service categories, and display preferences',
        badge: undefined,
      };
    }
    return {
      title: 'e-Gram Center Dashboard',
      subtitle: 'ગુજરાત સરકાર • પંચાયત, ગ્રામ ગૃહનિર્માણ અને ગ્રામ વિકાસ વિભાગ | e-Gram Vishwagram Project',
      badge: 'Live Center',
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="app-container">
      {/* Desktop Fixed Workstation Sidebar */}
      <div id="sidebar-container">
        <Sidebar onOpenQuickEntry={() => setQuickEntryOpen(true)} />
      </div>

      {/* Mobile Off-Canvas Drawer */}
      <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      {/* Main Administrative Workstation Shell */}
      <div className="main-wrapper">
        <TopBar
          onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          badge={headerInfo.badge}
        />

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenQuickEntry={() => setQuickEntryOpen(true)} />

      {/* Global Quick Entry Modal */}
      <QuickEntryModal isOpen={quickEntryOpen} onClose={() => setQuickEntryOpen(false)} />
    </div>
  );
};
export default AppLayout;
