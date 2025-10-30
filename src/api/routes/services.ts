/**
 * Services Routes
 * Service catalog and management endpoints
 */

import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { validateUUID } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/services:
 *   get:
 *     tags: [Services]
 *     summary: Get services
 *     description: Get list of services with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [beauty, fitness, lifestyle]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('serviceType').optional().isIn(['beauty', 'fitness', 'lifestyle']),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString().trim(),
  ],
  validateRequest([]),
  asyncHandler(async (req, res) => {
    // Service controller implementation
    res.json({ success: true, data: [], pagination: {} });
  })
);

/**
 * @swagger
 * /api/v1/services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get service details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service details retrieved successfully
 */
router.get(
  '/:id',
  [
    param('id').custom((value) => validateUUID(value)).withMessage('Invalid service ID'),
  ],
  validateRequest([]),
  asyncHandler(async (req, res) => {
    // Service controller implementation
    res.json({ success: true, data: {} });
  })
);

/**
 * @swagger
 * /api/v1/services/featured:
 *   get:
 *     tags: [Services]
 *     summary: Get featured services
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 6
 *     responses:
 *       200:
 *         description: Featured services retrieved successfully
 */
router.get(
  '/featured',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  ],
  validateRequest([]),
  asyncHandler(async (req, res) => {
    // Service controller implementation
    res.json({ success: true, data: [] });
  })
);

export { router as serviceRoutes };