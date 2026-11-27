require('dotenv').config({ quiet: true });
const Razorpay = require('razorpay');
const prisma = require('../src/config/db');

const paymentStates = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const matchesOrder = (payment, order) => payment.order_id === order.razorpayOrderId &&
  payment.status === 'captured' && payment.amount === Math.round(order.totalAmount * 100) &&
  payment.currency === order.currency;

async function reconcile() {
  const [fromValue, toValue] = process.argv.slice(2);
  const from = new Date(fromValue);
  const to = new Date(toValue);
  if (!Number.isFinite(+from) || !Number.isFinite(+to) || to <= from) {
    throw new Error('Usage: node prisma/reconcilePayments.js <from-ISO-date> <to-ISO-date>');
  }
  const { RAZORPAY_KEY_ID: key_id, RAZORPAY_KEY_SECRET: key_secret } = process.env;
  if (!key_id || !key_secret) throw new Error('Razorpay credentials are required.');
  const gateway = new Razorpay({ key_id, key_secret });
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lt: to }, razorpayOrderId: { not: null } },
    select: { orderNumber: true, razorpayOrderId: true, razorpayPaymentId: true, totalAmount: true, currency: true, status: true },
    take: 201,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  if (orders.length > 200) throw new Error('Select a shorter time range with at most 200 orders.');

  let flagged = 0;
  for (const order of orders) {
    const { items } = await gateway.orders.fetchPayments(order.razorpayOrderId);
    const captured = items.filter((payment) => payment.status === 'captured');
    const paid = paymentStates.includes(order.status);
    if (paid
      ? captured.length !== 1 || captured[0].id !== order.razorpayPaymentId || !matchesOrder(captured[0], order)
      : captured.length > 0) {
      flagged += 1;
      console.log(JSON.stringify({ order: order.orderNumber, shopStatus: order.status, capturedPayments: captured.length }));
    }
  }
  console.log(JSON.stringify({ checked: orders.length, flagged }));
  if (flagged) process.exitCode = 2;
}

reconcile().catch((error) => {
  if (error.statusCode || error.code || error.name === 'PrismaClientInitializationError') {
    console.error('Reconciliation could not complete. Check database access and Razorpay credentials.');
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
