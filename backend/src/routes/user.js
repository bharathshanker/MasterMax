import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
} from '../controller/userController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Protect user profile routes with JWT middleware
router.get('/user-profile', authMiddleware, getUserProfile);
router.post('/user-profile', authMiddleware, updateUserProfile);

export default router;
