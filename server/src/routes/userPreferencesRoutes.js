import express from 'express';
import auth from '../middleware/auth.js';
import {
  getUserPreferences,
  updateUserPreferences,
  getUserAchievements
} from '../controllers/userPreferencesController.js';

const router = express.Router();

// Preferences
router.get('/preferences', auth, getUserPreferences);
router.put('/preferences', auth, updateUserPreferences);

// Achievements
router.get('/achievements', auth, getUserAchievements);

export default router;
