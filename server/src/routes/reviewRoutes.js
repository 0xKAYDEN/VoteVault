import express from 'express';
import { getReviews, submitReview, submitReply, updateReview } from '../controllers/reviewController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/:serverId', getReviews);
router.post('/:reviewId/reply', auth, submitReply);
router.put('/:reviewId', auth, updateReview);
router.post('/', auth, submitReview);

export default router;
