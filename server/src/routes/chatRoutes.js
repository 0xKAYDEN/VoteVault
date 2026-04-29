import express from 'express';
import * as chatController from '../controllers/chatController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/send', auth, chatController.sendMessage);
router.get('/conversation/:friendId', auth, chatController.getConversation);
router.delete('/conversation/:friendId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    // Soft delete — mark messages as deleted for this user only
    await (await import('../db.js')).default.query(
      `DELETE FROM chat_messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
      [userId, friendId, friendId, userId]
    );
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});
router.post('/read/:friendId', auth, chatController.markAsRead);
router.get('/unread-count', auth, chatController.getUnreadCount);
router.get('/recent', auth, chatController.getRecentConversations);

export default router;
