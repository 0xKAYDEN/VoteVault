import express from 'express';
import auth from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.post('/:notificationId/read', auth, markAsRead);
router.post('/read-all', auth, markAllAsRead);
router.delete('/:notificationId', auth, deleteNotification);

export default router;
