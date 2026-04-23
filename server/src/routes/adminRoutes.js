import express from 'express';
import { 
  getAllServers, updateServerStatus, 
  getAllUsers, updateUserRole, getAdminStats 
} from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

const router = express.Router();

// Apply both auth and adminOnly to all routes in this file
router.use(auth);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/servers', getAllServers);
router.put('/servers/:id/status', updateServerStatus);
router.get('/users', getAllUsers);
router.put('/users/:userId/roles', updateUserRole);

export default router;
