import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, MapPin, CheckSquare, Settings } from 'lucide-react';
import './MobileBottomNav.css';

export default function MobileBottomNav() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/leads', icon: Target, label: 'Leads' },
    { to: '/field-ops', icon: MapPin, label: 'FieldOps' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink 
          key={to} 
          to={to} 
          end={to === '/'} 
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
