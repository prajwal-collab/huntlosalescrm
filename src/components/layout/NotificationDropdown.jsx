import { useState, useRef, useEffect } from 'react';
import { Check, BellOff, ArrowRight } from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import './NotificationDropdown.css';

const INITIAL_NOTIFICATIONS = [];

export default function NotificationDropdown({ onClose }) {
  const { notifications, markAllNotificationsRead, markNotificationRead, clearNotifications } = useUIStore();
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !event.target.closest('#notif-bell-btn')) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleMarkRead = (id) => {
    markNotificationRead(id);
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => n.unread)
    : notifications;

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notif-header">
        <h3 className="notif-title">Notifications</h3>
        <button 
          className="notif-mark-read" 
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </div>

      <div className="notif-tabs">
        <button 
          className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      <div className="notif-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notif-item ${notif.unread ? 'unread' : ''}`}
              onClick={() => handleMarkRead(notif.id)}
            >
              <div className={`notif-icon-wrapper ${notif.type}`}>
                {notif.icon}
              </div>
              <div className="notif-content">
                <div className="notif-meta">
                  <span className="notif-user">{notif.user}</span>
                  <span className="notif-time">{notif.time}</span>
                </div>
                <div className="notif-text">
                  {notif.action} <strong>{notif.target}</strong> {notif.meta && <><br/>{notif.meta}</>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Check size={24} />
            </div>
            <span>You're all caught up!</span>
          </div>
        )}
      </div>
    </div>
  );
}
