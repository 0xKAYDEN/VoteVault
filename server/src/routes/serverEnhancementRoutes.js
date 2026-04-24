import express from 'express';
import auth from '../middleware/auth.js';
import {
  toggleFavorite,
  getUserFavorites,
  checkFavorite,
  addServerTags,
  removeServerTag,
  getServerTags,
  getServersByTag,
  getAllTags,
  addServerUpdate,
  getServerUpdates,
  compareServers
} from '../controllers/serverEnhancementController.js';

const router = express.Router();

// Favorites
router.post('/favorites', auth, toggleFavorite);
router.get('/favorites', auth, getUserFavorites);
router.get('/favorites/check/:serverId', auth, checkFavorite);

// Tags
router.post('/:serverId/tags', auth, addServerTags);
router.delete('/:serverId/tags/:tag', auth, removeServerTag);
router.get('/:serverId/tags', getServerTags);
router.get('/by-tag/:tag', getServersByTag);
router.get('/tags/all', getAllTags);

// Updates/Changelog
router.post('/:serverId/updates', auth, addServerUpdate);
router.get('/:serverId/updates', getServerUpdates);

// Comparison
router.get('/compare', compareServers);

export default router;
