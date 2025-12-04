import { Notification, User } from '../types';

const NOTIFICATIONS_KEY = 'notifications';

export const getNotifications = (userId: string): Notification[] => {
  const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!allNotifications) return [];
  
  const notifications: Notification[] = JSON.parse(allNotifications);
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getUnreadCount = (userId: string): number => {
  const notifications = getNotifications(userId);
  return notifications.filter(n => !n.read).length;
};

export const createNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification => {
  const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
  const notifications: Notification[] = allNotifications ? JSON.parse(allNotifications) : [];

  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.push(newNotification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  return newNotification;
};

export const markAsRead = (notificationId: string): void => {
  const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!allNotifications) return;

  const notifications: Notification[] = JSON.parse(allNotifications);
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

export const markAllAsRead = (userId: string): void => {
  const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!allNotifications) return;

  const notifications: Notification[] = JSON.parse(allNotifications);
  notifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
    }
  });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const notifyLike = (postUserId: string, fromUser: User, postId: string): void => {
  if (postUserId === fromUser.id) return; // Don't notify self
  
  createNotification({
    userId: postUserId,
    type: 'like',
    fromUserId: fromUser.id,
    fromUsername: fromUser.username,
    fromUserAvatar: fromUser.avatar,
    postId,
  });
};

export const notifyComment = (postUserId: string, fromUser: User, postId: string, commentId: string): void => {
  if (postUserId === fromUser.id) return; // Don't notify self
  
  createNotification({
    userId: postUserId,
    type: 'comment',
    fromUserId: fromUser.id,
    fromUsername: fromUser.username,
    fromUserAvatar: fromUser.avatar,
    postId,
    commentId,
  });
};

export const notifyFollow = (targetUserId: string, fromUser: User): void => {
  if (targetUserId === fromUser.id) return; // Don't notify self
  
  createNotification({
    userId: targetUserId,
    type: 'follow',
    fromUserId: fromUser.id,
    fromUsername: fromUser.username,
    fromUserAvatar: fromUser.avatar,
  });
};

