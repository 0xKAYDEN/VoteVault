import pool from '../db.js';
import logger from '../utils/logger.js';
import { createNotification } from './notificationController.js';

// Send a message request to a non-friend
export const sendMessageRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message?.trim()) {
      return res.status(400).json({ error: 'receiverId and message are required' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send a message request to yourself' });
    }

    // Check if already friends — if so, just use normal chat
    const [friendship] = await pool.query(
      `SELECT id FROM friendships
       WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`,
      [senderId, receiverId, receiverId, senderId]
    );
    if (friendship.length > 0) {
      return res.status(400).json({ error: 'You are already friends — use the chat directly', alreadyFriends: true });
    }

    // Check if request already exists
    const [existing] = await pool.query(
      'SELECT id, status FROM message_requests WHERE sender_id = ? AND receiver_id = ?',
      [senderId, receiverId]
    );
    if (existing.length > 0) {
      if (existing[0].status === 'pending') {
        return res.status(400).json({ error: 'You already have a pending message request to this user' });
      }
      if (existing[0].status === 'declined') {
        // Allow re-sending after decline — update the existing row
        await pool.query(
          'UPDATE message_requests SET message = ?, status = "pending", updated_at = NOW() WHERE id = ?',
          [message.trim(), existing[0].id]
        );
        return res.json({ message: 'Message request sent' });
      }
    }

    await pool.query(
      'INSERT INTO message_requests (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [senderId, receiverId, message.trim()]
    );

    // Notify receiver
    const [senderProfile] = await pool.query(
      'SELECT display_name, username FROM profiles WHERE id = ?', [senderId]
    );
    const senderName = senderProfile[0]?.display_name || senderProfile[0]?.username || 'Someone';
    await createNotification(
      receiverId, 'message_request', 'New Message Request',
      `${senderName} wants to send you a message`,
      `/messages`
    );

    logger.info(`Message request sent from ${senderId} to ${receiverId}`);
    res.json({ message: 'Message request sent' });
  } catch (error) {
    logger.error('Error sending message request:', error);
    res.status(500).json({ error: 'Failed to send message request' });
  }
};

// Get incoming message requests
export const getMessageRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT mr.*, p.username, p.display_name, p.avatar_url
       FROM message_requests mr
       JOIN profiles p ON mr.sender_id = p.id
       WHERE mr.receiver_id = ? AND mr.status = 'pending'
       ORDER BY mr.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    logger.error('Error fetching message requests:', error);
    res.status(500).json({ error: 'Failed to fetch message requests' });
  }
};

// Accept a message request — creates a friendship so they can chat
export const acceptMessageRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const [requests] = await pool.query(
      'SELECT * FROM message_requests WHERE id = ? AND receiver_id = ? AND status = "pending"',
      [requestId, userId]
    );
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Message request not found' });
    }

    const request = requests[0];

    // Create friendship so they can chat
    await pool.query(
      'INSERT IGNORE INTO friendships (user_id_1, user_id_2) VALUES (?, ?)',
      [request.sender_id, request.receiver_id]
    );

    // Mark request as accepted
    await pool.query(
      'UPDATE message_requests SET status = "accepted" WHERE id = ?',
      [requestId]
    );

    // Notify sender
    const [receiverProfile] = await pool.query(
      'SELECT display_name, username FROM profiles WHERE id = ?', [userId]
    );
    const receiverName = receiverProfile[0]?.display_name || receiverProfile[0]?.username || 'Someone';
    await createNotification(
      request.sender_id, 'message', 'Message Request Accepted',
      `${receiverName} accepted your message request`,
      `/messages/${userId}`
    );

    logger.info(`Message request ${requestId} accepted by ${userId}`);
    res.json({ message: 'Message request accepted', senderId: request.sender_id });
  } catch (error) {
    logger.error('Error accepting message request:', error);
    res.status(500).json({ error: 'Failed to accept message request' });
  }
};

// Decline a message request
export const declineMessageRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    await pool.query(
      'UPDATE message_requests SET status = "declined" WHERE id = ? AND receiver_id = ?',
      [requestId, userId]
    );

    res.json({ message: 'Message request declined' });
  } catch (error) {
    logger.error('Error declining message request:', error);
    res.status(500).json({ error: 'Failed to decline message request' });
  }
};

// Check if a message request exists between two users
export const checkMessageRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    const [sent] = await pool.query(
      'SELECT id, status FROM message_requests WHERE sender_id = ? AND receiver_id = ?',
      [userId, targetId]
    );
    const [received] = await pool.query(
      'SELECT id, status FROM message_requests WHERE sender_id = ? AND receiver_id = ?',
      [targetId, userId]
    );

    res.json({
      sent: sent[0] || null,
      received: received[0] || null,
    });
  } catch (error) {
    logger.error('Error checking message request:', error);
    res.status(500).json({ error: 'Failed to check message request' });
  }
};
