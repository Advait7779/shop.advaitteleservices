const crypto = require('crypto');
const prisma = require('../config/db');
const { parsePagination } = require('../utils/pagination');
const { razorpayInstance, key_id, key_secret } = require('../config/razorpay');
const audit = require('../services/securityAudit');

const moneyPaise = (price) => Math.round(price * 100);
const publicOrder = ({ checkoutKey, cartSnapshot, razorpaySignature, ...order }) => order;
const safeAddress = (user, custom) => {
  const input = custom && typeof custom === 'object' && !Array.isArray(custom) ? custom : {};
  const value = (key, fallback) => typeof input[key] === 'string' && input[key].trim()
    ? input[key].trim() : fallback;
  const address = {
    fullName: value('fullName', user.fullName),
    mobileNumber: user.mobileNumber,
    addressLine1: value('addressLine1', user.addressLine1),
    addressLine2: typeof input.addressLine2 === 'string' ? input.addressLine2.trim() : user.addressLine2 || '',
    city: value('city', user.city),
    pincode: value('pincode', user.pincode),
  };
  return address.fullName && address.addressLine1 && address.city && /^\d{6}$/.test(address.pincode)
    ? address : null;
};

const checkoutResponse = (order, user) => ({
  success: true,
  orderId: order.id,
  orderNumber: order.orderNumber,
  amount: order.totalAmount,
  currency: order.currency,
  razorpayOrderId: order.razorpayOrderId,
  keyId: key_id,
  customer: { name: user.fullName, contact: user.mobileNumber, address: order.shippingAddress },
});

async function markPaid(order, paymentId, signature) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: { in: ['PENDING', 'CANCELLED'] } },
      data: { status: 'PAID', razorpayPaymentId: paymentId, razorpaySignature: signature },
    });
    if (claimed.count === 1 && Array.isArray(order.cartSnapshot)) {
      for (const item of order.cartSnapshot) {
        await tx.cartItem.deleteMany({
          where: { id: item.id, userId: order.userId, quantity: item.quantity },
        });
      }
    }
    return tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
  });
}

exports.createOrder = async (req, res) => {
  try {
    if (process.env.PAYMENTS_ENABLED !== 'true') {
      return res.status(503).json({ success: false, message: 'Online payments are temporarily unavailable.' });
    }
    if (!razorpayInstance || !key_id || !key_secret) {
      return res.status(503).json({ success: false, message: 'Payment gateway is not configured.' });
    }
    const checkoutKey = req.body.checkoutKey;
    if (typeof checkoutKey !== 'string' || !/^[0-9a-f-]{36}$/i.test(checkoutKey)) {
      return res.status(400).json({ success: false, message: 'Invalid checkout request.' });
    }
    const existing = await prisma.order.findUnique({ where: { checkoutKey } });
    if (existing) {
      if (existing.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });
      if (existing.status === 'PENDING' && existing.razorpayOrderId) return res.json(checkoutResponse(existing, req.user));
      return res.status(409).json({ success: false, message: 'This checkout attempt has ended. Please retry.' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id }, include: { product: true },
    });
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    for (const item of cartItems) {
      const price = item.product.sellingPrice;
      if (!item.product.inStock || !item.product.planOptions.includes(item.planDuration) ||
          !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 ||
          !Number.isFinite(price) || price <= 0 || Math.abs(moneyPaise(price) - price * 100) > 0.000001) {
        return res.status(400).json({ success: false, message: 'Your cart contains an unavailable or invalid item. Please review it.' });
      }
    }
    const amountPaise = cartItems.reduce((sum, item) => sum + moneyPaise(item.product.sellingPrice) * item.quantity, 0);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ success: false, message: 'Invalid order total.' });
    }
    const shippingAddress = safeAddress(req.user, req.body.customAddress);
    if (!shippingAddress) return res.status(400).json({ success: false, message: 'Enter a valid shipping address and PIN.' });

    const order = await prisma.order.create({
      data: {
        checkoutKey,
        orderNumber: `ADV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        userId: req.user.id,
        totalAmount: amountPaise / 100,
        currency: 'INR',
        status: 'PENDING',
        shippingAddress,
        cartSnapshot: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        items: { create: cartItems.map((item) => ({
          productId: item.productId,
          productTitle: item.product.title,
          planDuration: item.planDuration,
          unitPrice: item.product.sellingPrice,
          quantity: item.quantity,
          subtotal: moneyPaise(item.product.sellingPrice) * item.quantity / 100,
        })) },
      },
    });
    try {
      const gatewayOrder = await razorpayInstance.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderNumber: order.orderNumber },
      });
      const updated = await prisma.order.update({
        where: { id: order.id }, data: { razorpayOrderId: gatewayOrder.id },
      });
      return res.json(checkoutResponse(updated, req.user));
    } catch (gatewayError) {
      console.error('Razorpay order creation failed:', gatewayError.statusCode || gatewayError.code || 'unknown');
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      return res.status(502).json({ success: false, message: 'Payment gateway is unavailable. Please retry.' });
    }
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Checkout already started. Please retry.' });
    console.error('Create order error:', error.code || error.name);
    return res.status(500).json({ success: false, message: 'Failed to create order.' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (![orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature].every((value) => typeof value === 'string' && value)) {
      return res.status(400).json({ success: false, message: 'Payment details are incomplete.' });
    }
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (order.razorpayPaymentId) {
      return order.razorpayPaymentId === razorpayPaymentId
        ? res.json({ success: true, order: publicOrder(order) })
        : res.status(409).json({ success: false, message: 'Order was already paid.' });
    }
    if (!['PENDING', 'CANCELLED'].includes(order.status) || !order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId || !razorpayInstance) {
      return res.status(400).json({ success: false, message: 'Payment does not match this order.' });
    }
    const expected = crypto.createHmac('sha256', key_secret)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (!/^[a-f0-9]{64}$/i.test(razorpaySignature) ||
        !crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(razorpaySignature, 'hex'))) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
    const payment = await razorpayInstance.payments.fetch(razorpayPaymentId);
    if (payment.id !== razorpayPaymentId || payment.order_id !== order.razorpayOrderId ||
        payment.amount !== moneyPaise(order.totalAmount) || payment.currency !== order.currency) {
      return res.status(400).json({ success: false, message: 'Payment amount or order does not match.' });
    }
    if (payment.status !== 'captured') {
      return res.status(202).json({ success: false, pending: true, message: 'Payment is awaiting capture. Your order will update automatically.' });
    }
    const updated = await markPaid(order, razorpayPaymentId, razorpaySignature);
    if (updated?.razorpayPaymentId !== razorpayPaymentId) {
      audit('payment_needs_reconciliation', { route: '/api/orders/verify' });
      return res.status(409).json({ success: false, message: 'Payment needs reconciliation. Check your order status.' });
    }
    return res.json({ success: true, message: 'Payment verified.', order: publicOrder(updated) });
  } catch (error) {
    console.error('Verify payment error:', error.statusCode || error.code || error.name || 'unknown');
    return res.status(502).json({ success: false, message: 'Could not verify payment. Please check your order shortly.' });
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.get('x-razorpay-signature');
    if (!secret || !Buffer.isBuffer(req.body) || !signature || !/^[a-f0-9]{64}$/i.test(signature)) {
      return res.sendStatus(400);
    }
    const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) return res.sendStatus(400);
    const event = JSON.parse(req.body.toString('utf8'));
    if (event.event !== 'payment.captured') return res.sendStatus(200);
    const payment = event.payload?.payment?.entity;
    if (!payment?.id || !payment?.order_id || payment.status !== 'captured') return res.sendStatus(400);
    const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
    if (!order || payment.amount !== moneyPaise(order.totalAmount) || payment.currency !== order.currency) return res.sendStatus(400);
    const settled = ['PENDING', 'CANCELLED'].includes(order.status)
      ? await markPaid(order, payment.id, signature)
      : order;
    if (settled?.razorpayPaymentId !== payment.id) {
      audit('payment_needs_reconciliation', { route: '/api/orders/webhook' });
      return res.sendStatus(409);
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error('Payment webhook error:', error.code || error.name);
    return res.sendStatus(500);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id }, include: { items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.json({ success: true, order: publicOrder(order) });
  } catch (error) {
    console.error('Get order error:', error.code || error.name);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order.' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    let pagination;
    try { pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 }); }
    catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    const where = { userId: req.user.id };
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true, orderNumber: true, totalAmount: true, currency: true,
          status: true, createdAt: true, trackingNumber: true, courierName: true,
          items: { select: { id: true, productTitle: true, planDuration: true, quantity: true, unitPrice: true, subtotal: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: pagination.limit,
        skip: pagination.skip,
      }),
      prisma.order.count({ where }),
    ]);
    return res.json({ success: true, orders, totalCount, page: pagination.page,
      totalPages: Math.max(1, Math.ceil(totalCount / pagination.limit)),
      hasNextPage: pagination.page * pagination.limit < totalCount });
  } catch (error) {
    console.error('Get orders error:', error.code || error.name);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
};
