import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Building2, Users, CheckSquare,
  Calendar, Zap, FileText, Settings, Bell, ChevronLeft,
  ChevronRight, LogOut, Sun, Moon, TrendingUp,
  ChevronDown, Target, BookOpen, Calculator, Video, Link
} from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.svg';
import './Sidebar.css';

const NAV_GROUPS = [
  {
    title: 'Revenue',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/leads', icon: Target, label: 'Leads' },
      { to: '/pipeline', icon: BarChart3, label: 'Pipeline' },
      { to: '/webinars', icon: Video, label: 'Webinars' },
    ]
  },
  {
    title: 'Sales Center',
    items: [
      { to: '/companies', icon: Building2, label: 'Accounts' },
      { to: '/contacts', icon: Users, label: 'Contacts' },
      { to: '/meetings', icon: Calendar, label: 'Meetings' },
      { to: '/calculator', icon: Calculator, label: 'Calculator' },
    ]
  },
  {
    title: 'Workflow',
    items: [
      { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/sequences', icon: Zap, label: 'Sequences' },
      { to: '/documents', icon: FileText, label: 'Documents' },
      { to: '/utm', icon: Link, label: 'LinkTrack' },
      { to: '/reports', icon: TrendingUp, label: 'Reports' },
      { to: '/team', icon: Users, label: 'Team View', badge: '●' },
    ]
  }
];

function NavGroup({ group, sidebarCollapsed }) {
  const [expanded, setExpanded] = useState(true);
  
  if (sidebarCollapsed) {
    return (
      <div className="sidebar-group collapsed">
        {group.items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={label}>
            <Icon size={16} />
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <div className="sidebar-group">
      <div className="group-header" onClick={() => setExpanded(!expanded)}>
        <span className="group-title">{group.title}</span>
        <ChevronDown size={14} className={`group-chevron ${expanded ? 'expanded' : ''}`} />
      </div>
      {expanded && (
        <div className="group-items">
          {group.items.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
              {badge && <span style={{ fontSize: 8, color: '#16a34a', marginLeft: 'auto' }}>{badge}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore();
  const { user, signOut } = useAuthStore();
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
        <div className="logo-wrapper" style={{ display: 'flex', alignItems: 'center', height: '32px', overflow: 'hidden' }}>
          <img src={logoImg} alt="Huntlo Icon" style={{ height: '32px', width: '32px', objectFit: 'contain', marginLeft: sidebarCollapsed ? '2px' : '0' }} />
          {!sidebarCollapsed && <span style={{ marginLeft: 8, fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: '#1b66f2', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>Huntlo</span>}
        </div>
        <button className="collapse-btn" onClick={toggleSidebar} title="Toggle sidebar">
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.title} group={group} sidebarCollapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={() => navigate('/settings?tab=notifications')}>
          <Bell size={16} />
          {!sidebarCollapsed && <span>Notifications</span>}
        </button>
        <button className="nav-item" onClick={() => navigate('/settings?tab=guide')}>
          <BookOpen size={16} />
          {!sidebarCollapsed && <span>User Guide</span>}
        </button>
        <button className="nav-item" onClick={() => navigate('/settings')}>
          <Settings size={16} />
          {!sidebarCollapsed && <span>Settings</span>}
        </button>

        <div className="sidebar-user" onClick={() => navigate('/settings?tab=profile')}>
          <div className="avatar avatar-sm" style={{ background: avatarColor, width: 24, height: 24, fontSize: 10, borderRadius: 6 }}>
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <span className="user-name">{name}</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className="sign-out-btn" onClick={(e) => { e.stopPropagation(); handleSignOut(); }} title="Sign out" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
              <LogOut size={14} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
