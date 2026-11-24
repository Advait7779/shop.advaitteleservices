const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All cart actions require customer authentication
router.use(authenticateUser);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
