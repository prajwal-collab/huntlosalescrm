// ============================================
// HUNTLO SALES OS — TOP BAR
// ============================================
import { useState, useEffect } from 'react';
import { Search, Bell, Plus, Command, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import NotificationDropdown from './NotificationDropdown';
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('huntlo_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('huntlo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('huntlo_theme', 'light');
    }
  }, [isDark]);

  const title = PAGE_TITLES[location.pathname] || 'Huntlo OS';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandCenter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommandCenter]);

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
        <button 
          className="icon-btn" 
          onClick={() => setIsDark(!isDark)} 
          title="Toggle Theme"
          style={{ marginRight: 8 }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="btn btn-sm btn-primary" onClick={onNewDeal}>
          <Plus size={13} />
          New Deal
        </button>
        <div style={{ position: 'relative' }}>
          <button id="notif-bell-btn" className="icon-btn relative" title="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={16} />
            {activeNotifications > 0 && (
              <span className="notif-badge">{activeNotifications}</span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
