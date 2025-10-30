/**
 * Users Routes
 * User management endpoints
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All user routes require authentication
router.use(authMiddleware.required);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const user = (req as any).user;
  res.json({ success: true, data: user });
}));

/**
 * @swagger
 * /api/v1/users/bookings:
 *   get:
 *     tags: [Users]
 *     summary: Get user bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 */
router.get('/bookings', asyncHandler(async (req, res) => {
  // Implementation
  res.json({ success: true, data: [] });
}));

export { router as userRoutes };