const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { logout } = require('../services/sessions');
const rateLimit = require('../middleware/rateLimit');
const { sharedAuthLimit } = require('../services/authThrottle');

router.post('/send-otp', sharedAuthLimit('otp-send', 20, 60 * 60_000), authController.sendOtp);
router.post('/verify-otp', sharedAuthLimit('otp-verify', 30, 60 * 60_000), authController.verifyOtp);
router.post('/complete-registration', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), authController.completeRegistration);
router.get('/me', authenticateUser, authController.getMe);
router.post('/logout', logout('CUSTOMER'));
router.put('/profile', authenticateUser, authController.updateProfile);

module.exports = router;
