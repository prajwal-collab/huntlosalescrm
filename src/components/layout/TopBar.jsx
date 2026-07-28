// ============================================
// HUNTLO SALES OS — TOP BAR v3
// ============================================
import { useState, useEffect } from 'react';
import { Search, Bell, Plus, Command, Moon, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import NotificationDropdown from './NotificationDropdown';
import './TopBar.css';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/pipeline': 'Pipeline',
  '/companies': 'Accounts',
  '/contacts': 'Contacts',
  '/tasks': 'Tasks',
  '/meetings': 'Meetings',
  '/sequences': 'Sequences',
  '/reports': 'Reports',
  '/documents': 'Documents',
  '/settings': 'Settings',
  '/call-logs': 'Call Logs',
  '/team': 'Team',
  '/webinars': 'Webinars',
  '/calculator': 'Calculator',
  '/utm': 'LinkTrack',
};

export default function TopBar({ onNewDeal }) {
  const { openCommandCenter, activeNotifications } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
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

  const title = PAGE_TITLES[location.pathname] || 'Huntlo';

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

  // User display
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = user?.user_metadata?.avatar_color || '#2563eb';

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
          <Search size={13} className="search-icon" />
          <span className="search-placeholder">Search or ask AI anything...</span>
          <kbd className="kbd">
            <Command size={9} />K
          </kbd>
        </button>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn"
          onClick={() => setIsDark(!isDark)}
          title="Toggle Theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="topbar-divider" />

        <button className="btn btn-sm btn-primary" onClick={onNewDeal}>
          <Plus size={13} />
          New Deal
        </button>

        <div style={{ position: 'relative' }}>
          <button
            id="notif-bell-btn"
            className="icon-btn"
            title="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={15} />
            {activeNotifications > 0 && (
              <span className="notif-badge">{activeNotifications}</span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className="topbar-divider" />

        <div
          className="topbar-user-avatar"
          style={{ background: avatarColor }}
          title={name}
          onClick={() => navigate('/settings?tab=profile')}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
