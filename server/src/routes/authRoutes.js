const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const rateLimit = require('../middleware/rateLimit');

router.post('/send-otp', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), authController.sendOtp);
router.post('/verify-otp', rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }), authController.verifyOtp);
router.post('/complete-registration', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), authController.completeRegistration);
router.get('/me', authenticateUser, authController.getMe);
router.put('/profile', authenticateUser, authController.updateProfile);

module.exports = router;
