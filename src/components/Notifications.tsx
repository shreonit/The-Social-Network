import { useState, useEffect, useRef } from 'react';
import { Notification, User } from '../types';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

interface NotificationsProps {
  loggedInUser: User;
}

const Notifications = ({ loggedInUser }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = () => {
    const notifs = getNotifications(loggedInUser.id);
    setNotifications(notifs);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
      loadNotifications();
    }
    setShowDropdown(false);
  };

  const handleMarkAllRead = () => {
    markAllAsRead(loggedInUser.id);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.fromUsername} liked your post`;
      case 'comment':
        return `${notification.fromUsername} commented on your post`;
      case 'follow':
        return `${notification.fromUsername} started following you`;
      default:
        return 'New notification';
    }
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <a
        href="#"
        className="navbar-link notifications-link"
        onClick={(e) => {
          e.preventDefault();
          setShowDropdown(!showDropdown);
        }}
      >
        Notification
        {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
      </a>
      {showDropdown && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <img
                    src={notification.fromUserAvatar}
                    alt={notification.fromUsername}
                    className="notification-avatar"
                  />
                  <div className="notification-content">
                    <div className="notification-text">{getNotificationText(notification)}</div>
                    <div className="notification-time">{formatTime(notification.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
