import { useState, useRef, useEffect } from 'react';
import { Check, X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useUIStore from '../../store/useUIStore';
import './NotificationDropdown.css';

// Map notification type → emoji icon
const TYPE_ICONS = {
  lead:    '👤',
  deal:    '💼',
  meeting: '📅',
  task:    '⏰',
  system:  '🔔',
  warning: '⚠️',
  success: '✅',
  document:'📄',
  reminder:'🔁',
  sdr:     '📊',
};

// Map notification type → route for navigation
const TYPE_ROUTES = {
  lead:    '/leads',
  deal:    '/pipeline',
  meeting: '/meetings',
  task:    '/tasks',
  system:  '/',
  warning: '/',
  document:'/documents',
  reminder:'/leads',
  sdr:     '/',
};

function formatTime(isoString) {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    const diff = (Date.now() - date.getTime()) / 1000; // seconds
    if (diff < 60)  return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Just now';
  }
}

export default function NotificationDropdown({ onClose }) {
  const { notifications, markAllNotificationsRead, markNotificationRead, deleteNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest('#notif-bell-btn')
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => n.unread)
    : notifications;

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleItemClick = (notif) => {
    markNotificationRead(notif.id);
    const route = notif.route || TYPE_ROUTES[notif.type] || '/';
    onClose();
    navigate(route);
  };

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    if (deleteNotification) deleteNotification(id);
    else markNotificationRead(id);
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <Bell size={15} style={{ color: 'var(--accent-blue)' }} />
          <h3 className="notif-title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="notif-unread-chip">{unreadCount} new</span>
          )}
        </div>
        <button
          className="notif-mark-read"
          onClick={markAllNotificationsRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
      </div>

      {/* Tabs */}
      <div className="notif-tabs">
        <button
          className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notification List */}
      <div className="notif-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`notif-item ${notif.unread ? 'unread' : ''} type-${notif.type || 'system'}`}
              onClick={() => handleItemClick(notif)}
            >
              {/* Unread dot */}
              {notif.unread && <span className="notif-dot" />}

              {/* Icon */}
              <div className={`notif-icon-wrapper ${notif.type || 'system'}`}>
                <span>{TYPE_ICONS[notif.type] || '🔔'}</span>
              </div>

              {/* Content */}
              <div className="notif-content">
                <div className="notif-meta">
                  <span className="notif-user">{notif.title || 'Notification'}</span>
                  <span className="notif-time">{formatTime(notif.time)}</span>
                </div>
                <div className="notif-text">
                  {notif.message || notif.meta || ''}
                </div>
                {notif.route && (
                  <span className="notif-link-hint">Click to view →</span>
                )}
              </div>

              {/* Dismiss */}
              <button
                className="notif-dismiss"
                onClick={(e) => handleDismiss(e, notif.id)}
                title="Dismiss"
              >
                <X size={12} />
              </button>
            </div>
          ))
        ) : (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Check size={22} />
            </div>
            <span className="notif-empty-title">You're all caught up!</span>
            <span className="notif-empty-sub">New activity will appear here</span>
          </div>
        )}
      </div>
    </div>
  );
}
