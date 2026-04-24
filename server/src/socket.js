import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from './config/database.js';
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

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`User connected: ${userId}`);

    // Set user online
    await setUserOnline(userId, true);

    // Notify friends that user is online
    await notifyFriendsStatus(userId, true);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message } = data;

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

        // Save message to database
        const [result] = await db.query(
          'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
          [userId, receiverId, message]
        );

        const messageData = {
          id: result.insertId,
          sender_id: userId,
          receiver_id: receiverId,
          message,
          is_read: false,
          created_at: new Date()
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

        // Update unread count
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
