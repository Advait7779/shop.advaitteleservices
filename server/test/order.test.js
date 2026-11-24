const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const dbPath = require.resolve('../src/config/db');
const razorpayPath = require.resolve('../src/config/razorpay');
let order;
let payment;
let deletedCartRows;
const prisma = {
  order: {
    findUnique: async ({ where }) => (where.id === order.id || where.razorpayOrderId === order.razorpayOrderId) ? order : null,
    updateMany: async ({ where, data }) => {
      if (where.id !== order.id || !where.status.in.includes(order.status)) return { count: 0 };
      Object.assign(order, data);
      return { count: 1 };
    },
  },
  cartItem: { deleteMany: async () => { deletedCartRows += 1; return { count: 1 }; } },
  $transaction: async (fn) => fn(prisma),
};
const gateway = { payments: { fetch: async () => payment } };
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };
require.cache[razorpayPath] = {
  id: razorpayPath, filename: razorpayPath, loaded: true,
  exports: { razorpayInstance: gateway, key_id: 'rzp_test_example', key_secret: 'test-secret' },
};
const controller = require('../src/controllers/orderController');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  sendStatus(code) { this.statusCode = code; return this; },
});
const request = (body, userId = 'customer-1') => ({ body, user: { id: userId }, get: () => null });
const signatureFor = (orderId, paymentId) => crypto.createHmac('sha256', 'test-secret').update(`${orderId}|${paymentId}`).digest('hex');

test.beforeEach(() => {
  order = {
    id: 'local-order-1', userId: 'customer-1', status: 'PENDING',
    razorpayOrderId: 'order_real_1', totalAmount: 3200, currency: 'INR',
    cartSnapshot: [{ id: 'cart-1', quantity: 1 }], items: [],
  };
  payment = { id: 'pay_1', order_id: 'order_real_1', amount: 320000, currency: 'INR', status: 'captured' };
  deletedCartRows = 0;
});

test('rejects incomplete payment evidence', async () => {
  const res = response();
  await controller.verifyPayment(request({ orderId: order.id }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(order.status, 'PENDING');
});

test('rejects another customer and a mismatched Razorpay order', async () => {
  const body = { orderId: order.id, razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: payment.id,
    razorpaySignature: signatureFor(order.razorpayOrderId, payment.id) };
  const other = response();
  await controller.verifyPayment(request(body, 'customer-2'), other);
  assert.equal(other.statusCode, 403);
  const wrong = response();
  await controller.verifyPayment(request({ ...body, razorpayOrderId: 'order_other' }), wrong);
  assert.equal(wrong.statusCode, 400);
  assert.equal(order.status, 'PENDING');
});

test('refuses to disclose another customer’s order', async () => {
  const res = response();
  await controller.getOrderById({ params: { id: order.id }, user: { id: 'customer-2', role: 'CUSTOMER' } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.order, undefined);
});

test('requires the captured amount and only clears the matching cart snapshot', async () => {
  const body = { orderId: order.id, razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: payment.id,
    razorpaySignature: signatureFor(order.razorpayOrderId, payment.id) };
  payment.amount = 100;
  const wrongAmount = response();
  await controller.verifyPayment(request(body), wrongAmount);
  assert.equal(wrongAmount.statusCode, 400);
  payment.amount = 320000;
  const paid = response();
  await controller.verifyPayment(request(body), paid);
  assert.equal(paid.statusCode, 200);
  assert.equal(order.status, 'PAID');
  assert.equal(deletedCartRows, 1);
  const repeat = response();
  await controller.verifyPayment(request(body), repeat);
  assert.equal(repeat.statusCode, 200);
  assert.equal(deletedCartRows, 1);
});

test('requires a signed captured-payment webhook', async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-test-secret';
  const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: payment } } }));
  const bad = response();
  await controller.paymentWebhook({ body: raw, get: () => 'bad' }, bad);
  assert.equal(bad.statusCode, 400);
  assert.equal(order.status, 'PENDING');
  const sig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
  const good = response();
  await controller.paymentWebhook({ body: raw, get: () => sig }, good);
  assert.equal(good.statusCode, 200);
  assert.equal(order.status, 'PAID');
});
