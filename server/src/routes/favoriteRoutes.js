import express from 'express';
import auth from '../middleware/auth.js';
import { toggleFavorite, getFavorites, checkFavorite } from '../controllers/favoriteController.js';

const router = express.Router();

router.get('/', auth, getFavorites);
router.post('/:serverId', auth, toggleFavorite);
router.get('/:serverId/check', auth, checkFavorite);

export default router;
