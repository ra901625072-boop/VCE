import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Plus, BookOpen, Users } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenQuickEntry: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenQuickEntry }) => {
  return (
    <div id="mobile-bottom-nav-container">
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/work"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={20} />
          <span>Work</span>
        </NavLink>

        {/* Center Raised Thumb FAB */}
        <button
          className="mobile-nav-fab"
          onClick={onOpenQuickEntry}
          aria-label="Quick Action Trigger"
          title="New Entry"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>

        <NavLink
          to="/rojmel"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          <span>Rojmel</span>
        </NavLink>

        <NavLink
          to="/citizens"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Citizens</span>
        </NavLink>
      </nav>
    </div>
  );
};
