// ============================================
// HUNTLO SALES OS — SIDEBAR
// ============================================
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Building2, Users, CheckSquare,
  Calendar, Zap, FileText, Settings, Bell, ChevronLeft,
  ChevronRight, LogOut, Sparkles, Sun, Moon, TrendingUp
} from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
import './Sidebar.css';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home OS' },
  { to: '/pipeline', icon: BarChart3, label: 'Pipeline' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/meetings', icon: Calendar, label: 'Meetings' },
  { to: '/sequences', icon: Zap, label: 'Sequences' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/reports', icon: TrendingUp, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore();
  const { user, isDemo, signOut } = useAuthStore();
  const navigate = useNavigate();

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = user?.user_metadata?.avatar_color || '#3b82f6';

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ padding: 0, overflow: 'hidden' }}>
          <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {!sidebarCollapsed && (
          <span className="logo-text">Huntlo<span className="logo-accent"> OS</span></span>
        )}
        <button className="collapse-btn" onClick={toggleSidebar} title="Toggle sidebar">
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? label : ''}
          >
            <Icon size={16} />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        {isDemo && !sidebarCollapsed && (
          <div className="demo-badge">Demo Mode</div>
        )}
        <button className="nav-item" onClick={toggleTheme} title="Toggle Light/Dark Mode">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button className="nav-item" onClick={() => navigate('/settings?tab=notifications')}>
          <Bell size={16} />
          {!sidebarCollapsed && <span>Notifications</span>}
        </button>

        <div className="sidebar-user" onClick={() => navigate('/settings?tab=profile')}>
          <div className="avatar avatar-sm" style={{ background: avatarColor }}>
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <span className="user-name">{name}</span>
              <span className="user-role">Admin</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className="sign-out-btn" onClick={(e) => { e.stopPropagation(); handleSignOut(); }} title="Sign out">
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
