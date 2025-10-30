/**
 * Booking Routes
 * Complete booking management endpoints
 */

import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { BookingController } from '../controllers/booking';
import { validateUUID, validateBookingDate, validateBookingTime } from '../middleware/validation';

const router = Router();
const bookingController = new BookingController();

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get user bookings
 *     description: Get authenticated user's bookings with pagination and filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of bookings per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, confirmed, cancelled, completed, no_show, rescheduled]
 *         description: Filter by booking status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get(
  '/',
  authMiddleware.required,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt(),
    query('status')
      .optional()
      .isIn(['draft', 'pending', 'confirmed', 'cancelled', completed', 'no_show', 'rescheduled']),
    query('startDate')
      .optional()
      .isISO8601()
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601()
      .toDate(),
  ],
  validateRequest([]),
  asyncHandler(bookingController.getUserBookings.bind(bookingController))
);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking details
 *     description: Get specific booking details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.get(
  '/:id',
  authMiddleware.required,
  authMiddleware.requireOwnership('id'),
  [
    param('id')
      .custom((value) => validateUUID(value))
      .withMessage('Invalid booking ID'),
  ],
  validateRequest([]),
  asyncHandler(bookingController.getBooking.bind(bookingController))
);

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create new booking
 *     description: Create a new booking for a service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - date
 *               - timeSlot
 *               - clientInfo
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *                 description: Service ID
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Booking date (YYYY-MM-DD)
 *               timeSlot:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 description: Time slot (HH:MM)
 *               clientInfo:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 2
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *               preferences:
 *                 type: object
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or slot not available
 *       409:
 *         description: Slot already booked
 */
router.post(
  '/',
  authMiddleware.required,
  [
    body('serviceId')
      .custom((value) => validateUUID(value))
      .withMessage('Invalid service ID'),
    body('date')
      .isISO8601()
      .custom((value) => validateBookingDate(new Date(value)))
      .withMessage('Invalid booking date'),
    body('timeSlot')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .custom((value) => validateBookingTime(value))
      .withMessage('Invalid time slot'),
    body('clientInfo.name')
      .isLength({ min: 2, max: 100 })
      .trim()
      .withMessage('Client name must be between 2 and 100 characters'),
    body('clientInfo.email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid client email'),
    body('clientInfo.phone')
      .optional()
      .isMobilePhone('pl-PL')
      .withMessage('Invalid Polish phone number'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .trim()
      .withMessage('Notes must not exceed 500 characters'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
  ],
  validateRequest([]),
  asyncHandler(bookingController.createBooking.bind(bookingController))
);

/**
 * @swagger
 * /api/v1/bookings/{id}/cancel:
 *   post:
 *     tags: [Bookings]
 *     summary: Cancel booking
 *     description: Cancel an existing booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *                 description: Cancellation reason
 *               refundRequested:
 *                 type: boolean
 *                 description: Whether to request a refund
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Cannot cancel booking (too late, already completed, etc.)
 *       404:
 *         description: Booking not found
 */
router.post(
  '/:id/cancel',
  authMiddleware.required,
  authMiddleware.requireOwnership('id'),
  [
    param('id')
      .custom((value) => validateUUID(value))
      .withMessage('Invalid booking ID'),
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .trim()
      .withMessage('Cancellation reason must not exceed 200 characters'),
    body('refundRequested')
      .optional()
      .isBoolean(),
  ],
  validateRequest([]),
  asyncHandler(bookingController.cancelBooking.bind(bookingController))
);

/**
 * @swagger
 * /api/v1/bookings/{id}/reschedule:
 *   post:
 *     tags: [Bookings]
 *     summary: Reschedule booking
 *     description: Reschedule an existing booking to a new date/time
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newDate
 *               - newTimeSlot
 *             properties:
 *               newDate:
 *                 type: string
 *                 format: date
 *                 description: New booking date (YYYY-MM-DD)
 *               newTimeSlot:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 description: New time slot (HH:MM)
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *                 description: Rescheduling reason
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Cannot reschedule booking or new slot not available
 *       404:
 *         description: Booking not found
 *       409:
 *         description: New time slot already booked
 */
router.post(
  '/:id/reschedule',
  authMiddleware.required,
  authMiddleware.requireOwnership('id'),
  [
    param('id')
      .custom((value) => validateUUID(value))
      .withMessage('Invalid booking ID'),
    body('newDate')
      .isISO8601()
      .custom((value) => validateBookingDate(new Date(value)))
      .withMessage('Invalid new booking date'),
    body('newTimeSlot')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .custom((value) => validateBookingTime(value))
      .withMessage('Invalid new time slot'),
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .trim()
      .withMessage('Rescheduling reason must not exceed 200 characters'),
  ],
  validateRequest([]),
  asyncHandler(bookingController.rescheduleBooking.bind(bookingController))
);

/**
 * @swagger
 * /api/v1/bookings/availability:
 *   get:
 *     tags: [Bookings]
 *     summary: Check availability
 *     description: Get available time slots for a service on a specific date
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Service ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check (YYYY-MM-DD)
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           default: Europe/Warsaw
 *         description: Timezone for availability checking
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     serviceId:
 *                       type: string
 *                       format: uuid
 *                     availableSlots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           startTime:
 *                             type: string
 *                             pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                           endTime:
 *                             type: string
 *                             pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                           available:
 *                             type: boolean
 *                           capacity:
 *                             type: integer
 *                           currentBookings:
 *                             type: integer
 *       400:
 *         description: Invalid parameters
 */
router.get(
  '/availability',
  authMiddleware.required,
  [
    query('serviceId')
      .custom((value) => validateUUID(value))
      .withMessage('Invalid service ID'),
    query('date')
      .isISO8601()
      .withMessage('Invalid date format'),
    query('timezone')
      .optional()
      .isIn(['Europe/Warsaw', 'UTC'])
      .withMessage('Invalid timezone'),
  ],
  validateRequest([]),
  asyncHandler(bookingController.getAvailability.bind(bookingController))
);

/**
 * @swagger
 * /api/v1/bookings/hold:
 *   post:
 *     tags: [Bookings]
 *     summary: Hold time slot
 *     description: Temporarily hold a time slot for booking (5 minutes)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - date
 *               - timeSlot
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *     responses:
 *       200:
 *         description: Time slot held successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 holdId:
 *                   type: string
 *                   format: uuid
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       409:
 *         description: Time slot not available
 */
router.post(
  '/hold',
  authMiddleware.required,
  [
    body('serviceId')
      .custom((value) => validateUUID(value))
      .withMessage('Invalid service ID'),
    body('date')
      .isISO8601()
      .withMessage('Invalid date format'),
    body('timeSlot')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time slot format'),
  ],
  validateRequest([]),
  asyncHandler(bookingController.holdSlot.bind(bookingController))
);

/**
 * @swagger
 * /api/v1/bookings/hold/{holdId}/release:
 *   delete:
 *     tags: [Bookings]
 *     summary: Release held time slot
 *     description: Release a previously held time slot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: holdId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hold ID
 *     responses:
 *       200:
 *         description: Time slot released successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Hold not found or expired
 */
router.delete(
  '/hold/:holdId/release',
  authMiddleware.required,
  [
    param('holdId')
      .custom((value) => validateUUID(value))
      .withMessage('Invalid hold ID'),
  ],
  validateRequest([]),
  asyncHandler(bookingController.releaseHold.bind(bookingController))
);

export { router as bookingRoutes };