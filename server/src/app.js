const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const prisma = require('./config/db');
const orderController = require('./controllers/orderController');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const quoteRoutes = require('./routes/quoteRoutes');

const app = express();
app.set('trust proxy', 1);

// Middlewares
if (process.env.CLIENT_URL) {
  app.use(cors({ origin: process.env.CLIENT_URL.split(',').map((url) => url.trim()), methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
}
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY' });
  next();
});

// Razorpay signs the exact raw bytes. Register this route before JSON parsing.
app.post('/api/orders/webhook', express.raw({ type: 'application/json', limit: '256kb' }), orderController.paymentWebhook);

app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads/products');
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use('/products', express.static(uploadDir, { fallthrough: true }));
app.use(express.static(clientDist, { fallthrough: true }));
app.use(express.static(path.resolve(__dirname, '../../client/public'), { fallthrough: true }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/products/') || path.extname(req.path) || !fs.existsSync(path.join(clientDist, 'index.html'))) return next();
  return res.sendFile(path.join(clientDist, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Request failed.' : (err.message || 'Internal Server Error'),
  });
});

module.exports = app;
