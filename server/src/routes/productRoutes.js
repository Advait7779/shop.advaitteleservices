const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { protectBrowserWrites } = require('../middleware/browserSecurity');

router.get('/', productController.getAllProducts);
router.get('/:slug', productController.getProductBySlug);
router.post('/:slug/reviews', protectBrowserWrites, authenticateUser, productController.createProductReview);

module.exports = router;
