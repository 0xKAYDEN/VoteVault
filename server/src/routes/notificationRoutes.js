import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.post('/:notificationId/read', authenticate, markAsRead);
router.post('/read-all', authenticate, markAllAsRead);
router.delete('/:notificationId', authenticate, deleteNotification);

export default router;
