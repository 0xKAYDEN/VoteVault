import express from 'express';
import * as chatController from '../controllers/chatController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/send', auth, chatController.sendMessage);
router.get('/conversation/:friendId', auth, chatController.getConversation);
router.post('/read/:friendId', auth, chatController.markAsRead);
router.get('/unread-count', auth, chatController.getUnreadCount);
router.get('/recent', auth, chatController.getRecentConversations);

export default router;
