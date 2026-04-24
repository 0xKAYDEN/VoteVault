import db from '../config/database.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

// Create notification in database
export const createNotification = async (userId, type, title, message, link = null) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, link]
    );
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
      [userId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Send friend request notification
export const notifyFriendRequest = async (senderId, receiverId) => {
  try {
    // Get sender info
    const [senders] = await db.query(
      'SELECT display_name, username FROM profiles WHERE id = ?',
      [senderId]
    );

    if (senders.length === 0) return;

    const senderName = senders[0].display_name || senders[0].username;

    // Create in-app notification
    await createNotification(
      receiverId,
      'friend_request',
      'New Friend Request',
      `${senderName} sent you a friend request`,
      `/user/${senderId}`
    );

    // Check if user wants email notifications
    const [users] = await db.query(
      'SELECT email, email_notifications, notify_friend_requests FROM users WHERE id = ?',
      [receiverId]
    );

    if (users.length > 0 && users[0].email_notifications && users[0].notify_friend_requests) {
      await sendEmail({
        to: users[0].email,
        subject: 'New Friend Request - Conquer Toplist',
        html: `
          <h2>New Friend Request</h2>
          <p><strong>${senderName}</strong> sent you a friend request.</p>
          <p><a href="${process.env.FRONTEND_URL}/user/${senderId}">View Profile</a></p>
        `
      });
    }
  } catch (error) {
    logger.error('Error sending friend request notification:', error);
  }
};

// Send message notification
export const notifyNewMessage = async (senderId, receiverId) => {
  try {
    // Get sender info
    const [senders] = await db.query(
      'SELECT display_name, username FROM profiles WHERE id = ?',
      [senderId]
    );

    if (senders.length === 0) return;

    const senderName = senders[0].display_name || senders[0].username;

    // Create in-app notification
    await createNotification(
      receiverId,
      'message',
      'New Message',
      `${senderName} sent you a message`,
      `/user/${senderId}`
    );

    // Check if user wants email notifications
    const [users] = await db.query(
      'SELECT email, email_notifications, notify_messages FROM users WHERE id = ?',
      [receiverId]
    );

    if (users.length > 0 && users[0].email_notifications && users[0].notify_messages) {
      await sendEmail({
        to: users[0].email,
        subject: 'New Message - Conquer Toplist',
        html: `
          <h2>New Message</h2>
          <p><strong>${senderName}</strong> sent you a message.</p>
          <p><a href="${process.env.FRONTEND_URL}">View Message</a></p>
        `
      });
    }
  } catch (error) {
    logger.error('Error sending message notification:', error);
  }
};

// Send review notification (for server owners)
export const notifyNewReview = async (serverId, reviewerId) => {
  try {
    // Get server owner
    const [servers] = await db.query(
      'SELECT owner_id, name FROM servers WHERE id = ?',
      [serverId]
    );

    if (servers.length === 0) return;

    const ownerId = servers[0].owner_id;
    const serverName = servers[0].name;

    // Get reviewer info
    const [reviewers] = await db.query(
      'SELECT display_name, username FROM profiles WHERE id = ?',
      [reviewerId]
    );

    const reviewerName = reviewers.length > 0
      ? (reviewers[0].display_name || reviewers[0].username)
      : 'Someone';

    // Create in-app notification
    await createNotification(
      ownerId,
      'review',
      'New Review',
      `${reviewerName} left a review on ${serverName}`,
      `/server/${serverId}`
    );

    // Check if user wants email notifications
    const [users] = await db.query(
      'SELECT email, email_notifications, notify_reviews FROM users WHERE id = ?',
      [ownerId]
    );

    if (users.length > 0 && users[0].email_notifications && users[0].notify_reviews) {
      await sendEmail({
        to: users[0].email,
        subject: `New Review on ${serverName} - Conquer Toplist`,
        html: `
          <h2>New Review</h2>
          <p><strong>${reviewerName}</strong> left a review on your server <strong>${serverName}</strong>.</p>
          <p><a href="${process.env.FRONTEND_URL}/server/${serverId}">View Review</a></p>
        `
      });
    }
  } catch (error) {
    logger.error('Error sending review notification:', error);
  }
};
