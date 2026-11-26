const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const rateLimit = require('../middleware/rateLimit');

const adminAuthController = require('../controllers/adminAuthController');
const adminProductController = require('../controllers/adminProductController');
const categoryController = require('../controllers/categoryController');
const adminOrderController = require('../controllers/adminOrderController');
const adminStatsController = require('../controllers/adminStatsController');
const adminCustomerController = require('../controllers/adminCustomerController');
const adminUploadController = require('../controllers/adminUploadController');
const quoteController = require('../controllers/quoteController');

// Enable with ADMIN_SLOW_REQUEST_MS to identify slow admin endpoints without
// logging request parameters, customer data, or authentication credentials.
const slowRequestMs = Number(process.env.ADMIN_SLOW_REQUEST_MS);
if (Number.isFinite(slowRequestMs) && slowRequestMs > 0) {
  router.use((req, res, next) => {
    const started = process.hrtime.bigint();
    res.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
      if (durationMs >= slowRequestMs) {
        console.warn(`[admin-api] ${req.method} ${req.route?.path || 'unmatched'} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
      }
    });
    next();
  });
}

// Authentication
router.post('/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), adminAuthController.adminLogin);
router.get('/auth/me', verifyAdmin, adminAuthController.getAdminProfile);

// Dashboard Analytics
router.get('/analytics/overview', verifyAdmin, adminStatsController.getAdminDashboardStats);

// Product Catalog Management
router.post('/categories', verifyAdmin, categoryController.createCategory);
router.get('/products', verifyAdmin, adminProductController.getAllProductsAdmin);
router.get('/products/:id', verifyAdmin, adminProductController.getProductByIdAdmin);
router.post('/products', verifyAdmin, adminProductController.createProductAdmin);
router.put('/products/:id', verifyAdmin, adminProductController.updateProductAdmin);
router.patch('/products/:id/stock', verifyAdmin, adminProductController.toggleStockAdmin);
router.delete('/products/:id', verifyAdmin, adminProductController.deleteProductAdmin);

// Image Upload
router.post('/upload', verifyAdmin, adminUploadController.uploadProductImage);
router.delete('/upload', verifyAdmin, adminUploadController.deleteUnusedProductImage);

// Orders Management
router.get('/orders', verifyAdmin, adminOrderController.getAllOrdersAdmin);
router.get('/orders/:id', verifyAdmin, adminOrderController.getOrderByIdAdmin);
router.patch('/orders/:id/status', verifyAdmin, adminOrderController.updateOrderStatusAdmin);

// Customer Directory
router.get('/customers', verifyAdmin, adminCustomerController.getAllCustomersAdmin);

router.get('/quotes', verifyAdmin, quoteController.listQuotesAdmin);
router.patch('/quotes/:id/status', verifyAdmin, quoteController.updateQuoteStatusAdmin);

module.exports = router;
