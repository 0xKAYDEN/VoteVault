import express from 'express';
import auth from '../middleware/auth.js';
import {
  sendMessageRequest,
  getMessageRequests,
  acceptMessageRequest,
  declineMessageRequest,
  checkMessageRequest,
} from '../controllers/messageRequestController.js';

const router = express.Router();

router.post('/', auth, sendMessageRequest);
router.get('/', auth, getMessageRequests);
router.post('/:requestId/accept', auth, acceptMessageRequest);
router.post('/:requestId/decline', auth, declineMessageRequest);
router.get('/check/:targetId', auth, checkMessageRequest);

export default router;
