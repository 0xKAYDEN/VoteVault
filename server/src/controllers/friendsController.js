import db from '../db.js';
import { notifyFriendRequest } from './notificationController.js';
import logger from '../utils/logger.js';

const FREE_FRIEND_LIMIT = 50;

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    const [existing] = await db.query(
      `SELECT * FROM friendships
       WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`,
      [senderId, receiverId, receiverId, senderId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists
    const [existingRequest] = await db.query(
      'SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = "pending"',
      [senderId, receiverId]
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Check friend limit for free users
    const [premiumCheck] = await db.query(
      `SELECT plan FROM payments WHERE user_id = ? AND status = 'active' AND expires_at > NOW() LIMIT 1`,
      [senderId]
    );
    const isPremium = premiumCheck.length > 0;

    if (!isPremium) {
      const [friendCount] = await db.query(
        `SELECT COUNT(*) as count FROM friendships WHERE user_id_1 = ? OR user_id_2 = ?`,
        [senderId, senderId]
      );
      if (friendCount[0].count >= FREE_FRIEND_LIMIT) {
        return res.status(403).json({
          error: `Free accounts are limited to ${FREE_FRIEND_LIMIT} friends. Upgrade to Premium for unlimited friends.`,
          requiresPremium: true,
        });
      }
    }

    // Create friend request
    await db.query(
      'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
      [senderId, receiverId]
    );

    // Send notification
    await notifyFriendRequest(senderId, receiverId);

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    logger.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};

// Get friend requests (received)
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await db.query(
      `SELECT fr.*, p.username, p.display_name, p.avatar_url
       FROM friend_requests fr
       JOIN profiles p ON fr.sender_id = p.id
       WHERE fr.receiver_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [userId]
    );

    res.json(requests);
  } catch (error) {
    logger.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    // Get the request
    const [requests] = await db.query(
      'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = "pending"',
      [requestId, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const request = requests[0];

    // Create friendship
    await db.query(
      'INSERT INTO friendships (user_id_1, user_id_2) VALUES (?, ?)',
      [request.sender_id, request.receiver_id]
    );

    // Update request status
    await db.query(
      'UPDATE friend_requests SET status = "accepted" WHERE id = ?',
      [requestId]
    );

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    logger.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    await db.query(
      'UPDATE friend_requests SET status = "rejected" WHERE id = ? AND receiver_id = ?',
      [requestId, userId]
    );

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    logger.error('Error rejecting friend request:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const [friends] = await db.query(
      `SELECT
        CASE
          WHEN f.user_id_1 = ? THEN f.user_id_2
          ELSE f.user_id_1
        END as friend_id,
        p.username,
        p.display_name,
        p.avatar_url,
        uos.is_online,
        uos.last_seen
       FROM friendships f
       JOIN profiles p ON (
         CASE
           WHEN f.user_id_1 = ? THEN f.user_id_2
           ELSE f.user_id_1
         END = p.id
       )
       LEFT JOIN user_online_status uos ON p.id = uos.user_id
       WHERE f.user_id_1 = ? OR f.user_id_2 = ?
       ORDER BY uos.is_online DESC, p.display_name ASC`,
      [userId, userId, userId, userId]
    );

    res.json(friends);
  } catch (error) {
    logger.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    await db.query(
      'DELETE FROM friendships WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)',
      [userId, friendId, friendId, userId]
    );

    res.json({ message: 'Friend removed' });
  } catch (error) {
    logger.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

// Check friendship status
export const checkFriendshipStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    // Check if friends
    const [friendships] = await db.query(
      `SELECT * FROM friendships
       WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`,
      [userId, targetUserId, targetUserId, userId]
    );

    if (friendships.length > 0) {
      return res.json({ status: 'friends' });
    }

    // Check for pending request
    const [sentRequest] = await db.query(
      'SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = "pending"',
      [userId, targetUserId]
    );

    if (sentRequest.length > 0) {
      return res.json({ status: 'request_sent' });
    }

    const [receivedRequest] = await db.query(
      'SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = "pending"',
      [targetUserId, userId]
    );

    if (receivedRequest.length > 0) {
      return res.json({ status: 'request_received', requestId: receivedRequest[0].id });
    }

    res.json({ status: 'none' });
  } catch (error) {
    logger.error('Error checking friendship status:', error);
    res.status(500).json({ error: 'Failed to check friendship status' });
  }
};
