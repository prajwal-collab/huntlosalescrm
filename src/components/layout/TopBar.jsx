// ============================================
// HUNTLO SALES OS — TOP BAR
// ============================================
import { useState } from 'react';
import { Search, Bell, Plus, Command } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import './TopBar.css';

const PAGE_TITLES = {
  '/': 'Home OS',
  '/pipeline': 'Pipeline',
  '/companies': 'Companies',
  '/contacts': 'Contacts',
  '/tasks': 'Tasks',
  '/meetings': 'Meetings',
  '/sequences': 'Sequences',
  '/reports': 'Reports',
  '/documents': 'Documents',
  '/settings': 'Settings',
};

export default function TopBar({ onNewDeal }) {
  const { openCommandCenter, activeNotifications } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);

  const title = PAGE_TITLES[location.pathname] || 'Huntlo OS';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="topbar-center">
        <button
          className={`ai-search-trigger ${searchFocused ? 'focused' : ''}`}
          onClick={openCommandCenter}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        >
          <Search size={14} className="search-icon" />
          <span className="search-placeholder">Search or ask AI anything...</span>
          <kbd className="kbd">
            <Command size={10} />K
          </kbd>
        </button>
      </div>

      <div className="topbar-right">
        <button className="btn btn-sm btn-primary" onClick={onNewDeal}>
          <Plus size={13} />
          New Deal
        </button>
        <button className="icon-btn relative" title="Notifications">
          <Bell size={16} />
          {activeNotifications > 0 && (
            <span className="notif-badge">{activeNotifications}</span>
          )}
        </button>
      </div>
    </header>
  );
}
