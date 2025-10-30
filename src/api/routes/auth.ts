/**
 * Authentication Routes
 * User registration, login, logout, and token management
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthController } from '../controllers/auth';
import { validateEmail, validatePolishPhone } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           minLength: 8
 *           description: User password
 *         rememberMe:
 *           type: boolean
 *           description: Whether to remember the user
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           minLength: 8
 *           description: User password
 *         fullName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: User full name
 *         phone:
 *           type: string
 *           description: Polish phone number
 *         acceptTerms:
 *           type: boolean
 *           description: Accept terms and conditions
 *         acceptMarketing:
 *           type: boolean
 *           description: Accept marketing communications
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         user:
 *           $ref: '#/components/schemas/User'
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         expiresIn:
 *           type: number
 *         message:
 *           type: string
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [admin, staff, customer, user]
 *         profile:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
 *             phone:
 *               type: string
 *             avatar:
 *               type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('fullName')
      .isLength({ min: 2, max: 100 })
      .trim()
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .custom((value) => {
        if (!validatePolishPhone(value)) {
          throw new Error('Please provide a valid Polish phone number');
        }
        return true;
      }),
    body('acceptTerms')
      .isBoolean()
      .equals('true')
      .withMessage('You must accept the terms and conditions'),
    body('acceptMarketing')
      .optional()
      .isBoolean(),
  ],
  validateRequest([]),
  asyncHandler(authController.register.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean(),
  ],
  validateRequest([]),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  validateRequest([]),
  asyncHandler(authController.refreshToken.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Invalidate user session and tokens
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/logout',
  authMiddleware.required,
  asyncHandler(authController.logout.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     description: Get authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/me',
  authMiddleware.required,
  asyncHandler(authController.getProfile.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     tags: [Authentication]
 *     summary: Update current user profile
 *     description: Update authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.put(
  '/me',
  authMiddleware.required,
  [
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .trim()
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .custom((value) => {
        if (value && !validatePolishPhone(value)) {
          throw new Error('Please provide a valid Polish phone number');
        }
        return true;
      }),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
  ],
  validateRequest([]),
  asyncHandler(authController.updateProfile.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change password
 *     description: Change user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid current password
 */
router.post(
  '/change-password',
  authMiddleware.required,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  validateRequest([]),
  asyncHandler(authController.changePassword.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Send password reset email to user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *     responses:
 *       200:
 *         description: Password reset email sent
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
 *         description: User not found
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  ],
  validateRequest([]),
  asyncHandler(authController.forgotPassword.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     description: Reset password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  validateRequest([]),
  asyncHandler(authController.resetPassword.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email address
 *     description: Verify user's email address using verification token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required'),
  ],
  validateRequest([]),
  asyncHandler(authController.verifyEmail.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend email verification
 *     description: Resend email verification email to user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/resend-verification',
  authMiddleware.required,
  asyncHandler(authController.resendVerification.bind(authController))
);

export { router as authRoutes };