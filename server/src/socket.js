import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from './db.js';
import logger from './utils/logger.js';
import { notifyNewMessage } from './controllers/notificationController.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:3000'
      ].filter(Boolean),
      credentials: true
    }
  });

  // Authentication middleware — read JWT from HttpOnly cookie on WS upgrade
  io.use(async (socket, next) => {
    try {
      // cookie-parser is not available in socket.io context; parse manually
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k, decodeURIComponent(v.join('='))];
        })
      );
      const token = cookies['auth_token']
        // Fallback: legacy Bearer token in handshake auth (non-browser clients)
        || socket.handshake.auth?.token;

      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Guard: reject connections that slipped through without a valid userId
    if (!userId) {
      logger.warn('Socket connection without userId — disconnecting');
      socket.disconnect(true);
      return;
    }

    logger.info(`User connected: ${userId}`);

    // Set user online
    await setUserOnline(userId, true);

    // Notify friends that user is online
    await notifyFriendsStatus(userId, true);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // FIX #17: Per-socket message rate limiting (20 messages/minute)
    const msgTimestamps = [];

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message } = data;

        // Rate limit: max 20 messages per minute
        const now = Date.now();
        while (msgTimestamps.length && now - msgTimestamps[0] > 60000) msgTimestamps.shift();
        if (msgTimestamps.length >= 20) {
          socket.emit('error', { message: 'Sending too fast, slow down.' });
          return;
        }
        msgTimestamps.push(now);

        // FIX #17: Validate message length
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }
        if (message.length > 2000) {
          socket.emit('error', { message: 'Message too long (max 2000 characters)' });
          return;
        }

        // Verify friendship
        const [friendships] = await db.query(
          `SELECT * FROM friendships
           WHERE (user_id_1 = ? AND user_id_2 = ?)
              OR (user_id_1 = ? AND user_id_2 = ?)`,
          [userId, receiverId, receiverId, userId]
        );

        if (friendships.length === 0) {
          socket.emit('error', { message: 'Can only message friends' });
          return;
        }

        // Check if either user has blocked the other
        const [blocks] = await db.query(
          'SELECT id FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
          [userId, receiverId, receiverId, userId]
        );
        if (blocks.length > 0) {
          socket.emit('error', { message: 'Cannot send message to this user' });
          return;
        }

        // Save message to database
        const [result] = await db.query(
          'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
          [userId, receiverId, message]
        );

        // Get sender profile for the message data
        const [senderProfile] = await db.query(
          'SELECT username, display_name, avatar_url FROM profiles WHERE id = ?',
          [userId]
        );
        const sender = senderProfile[0] || {};

        const messageData = {
          id: result.insertId,
          sender_id: userId,
          receiver_id: receiverId,
          message,
          is_read: false,
          created_at: new Date(),
          // Include sender info so mini panel can display it
          username: sender.username,
          display_name: sender.display_name,
          avatar_url: sender.avatar_url,
        };

        // Send to receiver if online
        io.to(`user:${receiverId}`).emit('new_message', messageData);

        // Confirm to sender
        socket.emit('message_sent', messageData);

        // Send notification
        await notifyNewMessage(userId, receiverId);

        // Update unread count for receiver
        const [unreadCount] = await db.query(
          'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = false',
          [receiverId]
        );
        io.to(`user:${receiverId}`).emit('unread_count', unreadCount[0].count);

      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiverId } = data;
      io.to(`user:${receiverId}`).emit('user_typing', { userId });
    });

    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      io.to(`user:${receiverId}`).emit('user_stop_typing', { userId });
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { friendId } = data;

        await db.query(
          'UPDATE chat_messages SET is_read = true WHERE sender_id = ? AND receiver_id = ? AND is_read = false',
          [friendId, userId]
        );

        // Notify the sender that their messages were read
        io.to(`user:${friendId}`).emit('messages_read', { by: userId });

        // Update unread count for current user
        const [unreadCount] = await db.query(
          'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = false',
          [userId]
        );
        socket.emit('unread_count', unreadCount[0].count);

      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    });

    // Handle friend request notifications
    socket.on('friend_request_sent', async (data) => {
      const { receiverId } = data;
      io.to(`user:${receiverId}`).emit('new_friend_request', { senderId: userId });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${userId}`);

      // Set user offline
      await setUserOnline(userId, false);

      // Notify friends that user is offline
      await notifyFriendsStatus(userId, false);
    });
  });

  return io;
};

// Helper function to set user online status
async function setUserOnline(userId, isOnline) {
  if (!userId) return; // Guard against null/undefined userId
  try {
    await db.query(
      `INSERT INTO user_online_status (user_id, is_online, last_seen)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE is_online = ?, last_seen = NOW()`,
      [userId, isOnline, isOnline]
    );
  } catch (error) {
    logger.error('Error setting user online status:', error);
  }
}

// Helper function to notify friends of status change
async function notifyFriendsStatus(userId, isOnline) {
  if (!userId) return; // Guard against null/undefined userId
  try {
    // Get all friends
    const [friends] = await db.query(
      `SELECT CASE
         WHEN user_id_1 = ? THEN user_id_2
         ELSE user_id_1
       END as friend_id
       FROM friendships
       WHERE user_id_1 = ? OR user_id_2 = ?`,
      [userId, userId, userId]
    );

    // Notify each friend
    friends.forEach(friend => {
      io.to(`user:${friend.friend_id}`).emit('friend_status_change', {
        userId,
        isOnline,
        lastSeen: new Date()
      });
    });
  } catch (error) {
    logger.error('Error notifying friends of status change:', error);
  }
}

// Export function to emit events from other parts of the app
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const getIO = () => io;
