import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, BarChart3, Phone, Menu } from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import './MobileBottomNav.css';

export default function MobileBottomNav() {
  const { mobileNavOpen, toggleMobileNav } = useUIStore();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/leads', icon: Target, label: 'Leads' },
    { to: '/pipeline', icon: BarChart3, label: 'Pipeline' },
    { to: '/call-logs', icon: Phone, label: 'Calls' },
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

      <button
        type="button"
        className={`mobile-nav-item mobile-menu-tab ${mobileNavOpen ? 'active' : ''}`}
        onClick={toggleMobileNav}
        aria-label="Toggle All Apps Menu"
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
