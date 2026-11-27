const express = require('express');
const router = express.Router();
const { verifyAdmin, requirePermission } = require('../middleware/authMiddleware');
const { logout } = require('../services/sessions');
const { sharedAuthLimit } = require('../services/authThrottle');
const audit = require('../services/securityAudit');

const adminAuthController = require('../controllers/adminAuthController');
const adminProductController = require('../controllers/adminProductController');
const categoryController = require('../controllers/categoryController');
const adminOrderController = require('../controllers/adminOrderController');
const adminStatsController = require('../controllers/adminStatsController');
const adminCustomerController = require('../controllers/adminCustomerController');
const adminUploadController = require('../controllers/adminUploadController');

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
router.post('/auth/login', sharedAuthLimit('admin-login', 20, 15 * 60_000), adminAuthController.adminLogin);
router.post('/auth/logout', logout('ADMIN'));
router.use(verifyAdmin);
router.get('/auth/me', adminAuthController.getAdminProfile);

router.use((req, res, next) => {
  res.once('finish', () => {
    if (!req.route) return;
    const sensitiveRead = ['/customers', '/orders/:id'].includes(req.route.path);
    if (res.statusCode === 403 || sensitiveRead || req.method !== 'GET') {
      audit('admin_action', {
        actorId: req.user.id, method: req.method, route: req.route.path, status: res.statusCode,
      });
    }
  });
  next();
});

const catalog = requirePermission('catalog');
const orders = requirePermission('orders');

// Dashboard Analytics
router.get('/analytics/overview', requirePermission('analytics'), adminStatsController.getAdminDashboardStats);

// Product Catalog Management
router.post('/categories', catalog, categoryController.createCategory);
router.get('/products', catalog, adminProductController.getAllProductsAdmin);
router.get('/products/:id', catalog, adminProductController.getProductByIdAdmin);
router.post('/products', catalog, adminProductController.createProductAdmin);
router.put('/products/:id', catalog, adminProductController.updateProductAdmin);
router.patch('/products/:id/stock', catalog, adminProductController.toggleStockAdmin);
router.delete('/products/:id', catalog, adminProductController.deleteProductAdmin);

// Image Upload
router.post('/upload', catalog, adminUploadController.uploadProductImage);
router.delete('/upload', catalog, adminUploadController.deleteUnusedProductImage);

// Orders Management
router.get('/orders', orders, adminOrderController.getAllOrdersAdmin);
router.get('/orders/:id', orders, adminOrderController.getOrderByIdAdmin);
router.patch('/orders/:id/status', orders, adminOrderController.updateOrderStatusAdmin);

// Customer Directory
router.get('/customers', requirePermission('customers'), adminCustomerController.getAllCustomersAdmin);

module.exports = router;
