const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Saved cart actions require customer authentication; guests keep their cart in the browser.
router.use(authenticateUser);

router.get('/', cartController.getCart);
router.post('/merge', cartController.mergeCart);
router.post('/add', cartController.addToCart);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
