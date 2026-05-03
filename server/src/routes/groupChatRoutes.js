import express from 'express';
import auth from '../middleware/auth.js';
import {
  createGroup, getMyGroups, getGroupMessages,
  sendGroupMessage, getGroupMembers, addGroupMember, leaveGroup,
} from '../controllers/groupChatController.js';

const router = express.Router();

router.post('/', auth, createGroup);
router.get('/', auth, getMyGroups);
router.get('/:groupId/messages', auth, getGroupMessages);
router.post('/:groupId/messages', auth, sendGroupMessage);
router.get('/:groupId/members', auth, getGroupMembers);
router.post('/:groupId/members', auth, addGroupMember);
router.delete('/:groupId/leave', auth, leaveGroup);

export default router;
