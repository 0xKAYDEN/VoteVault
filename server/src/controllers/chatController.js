import db from '../db.js';
import logger from '../utils/logger.js';

// Send message
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Check if users are friends
    const [friendships] = await db.query(
      `SELECT * FROM friendships
       WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`,
      [senderId, receiverId, receiverId, senderId]
    );

    if (friendships.length === 0) {
      return res.status(403).json({ error: 'Can only message friends' });
    }

    // Insert message
    const [result] = await db.query(
      'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [senderId, receiverId, message.trim()]
    );

    res.json({ id: result.insertId, message: 'Message sent' });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get conversation with a friend
export const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const [messages] = await db.query(
      `SELECT cm.*, p.username, p.display_name, p.avatar_url
       FROM chat_messages cm
       JOIN profiles p ON cm.sender_id = p.id
       WHERE (cm.sender_id = ? AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = ?)
       ORDER BY cm.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, friendId, friendId, userId, parseInt(limit), parseInt(offset)]
    );

    res.json(messages.reverse());
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    await db.query(
      'UPDATE chat_messages SET is_read = true WHERE sender_id = ? AND receiver_id = ? AND is_read = false',
      [friendId, userId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = false',
      [userId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Get recent conversations
export const getRecentConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await db.query(
      `SELECT
        CASE
          WHEN cm.sender_id = ? THEN cm.receiver_id
          ELSE cm.sender_id
        END as friend_id,
        p.username,
        p.display_name,
        p.avatar_url,
        cm.message as last_message,
        cm.created_at as last_message_at,
        cm.sender_id = ? as is_sent,
        (SELECT COUNT(*) FROM chat_messages
         WHERE sender_id = friend_id AND receiver_id = ? AND is_read = false) as unread_count,
        uos.is_online
       FROM chat_messages cm
       JOIN profiles p ON (
         CASE
           WHEN cm.sender_id = ? THEN cm.receiver_id
           ELSE cm.sender_id
         END = p.id
       )
       LEFT JOIN user_online_status uos ON p.id = uos.user_id
       WHERE cm.sender_id = ? OR cm.receiver_id = ?
       GROUP BY friend_id
       ORDER BY cm.created_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );

    res.json(conversations);
  } catch (error) {
    logger.error('Error fetching recent conversations:', error);
    res.status(500).json({ error: 'Failed to fetch recent conversations' });
  }
};
