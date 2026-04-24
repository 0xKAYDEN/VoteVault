import express from 'express';
import * as friendsController from '../controllers/friendsController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/request', auth, friendsController.sendFriendRequest);
router.get('/requests', auth, friendsController.getFriendRequests);
router.post('/requests/:requestId/accept', auth, friendsController.acceptFriendRequest);
router.post('/requests/:requestId/reject', auth, friendsController.rejectFriendRequest);
router.get('/list', auth, friendsController.getFriends);
router.delete('/:friendId', auth, friendsController.removeFriend);
router.get('/status/:targetUserId', auth, friendsController.checkFriendshipStatus);

export default router;
