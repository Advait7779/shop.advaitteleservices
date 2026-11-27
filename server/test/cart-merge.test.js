const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const cart = new Map();
const product = {
  id: 'tracker-1',
  inStock: true,
  planOptions: ['1 Year'],
};
const prisma = {
  $transaction: async (work) => work(prisma),
  product: { findUnique: async ({ where }) => where.id === product.id ? product : null },
  cartItem: {
    findUnique: async ({ where }) => cart.get(`${where.userId_productId_planDuration.userId}:${where.userId_productId_planDuration.productId}:${where.userId_productId_planDuration.planDuration}`) || null,
    create: async ({ data }) => {
      const item = { id: `item-${cart.size + 1}`, ...data };
      cart.set(`${data.userId}:${data.productId}:${data.planDuration}`, item);
      return item;
    },
    update: async ({ where, data }) => {
      const item = [...cart.values()].find((entry) => entry.id === where.id);
      item.quantity = data.quantity;
      return item;
    },
  },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };
const { mergeCart } = require('../src/controllers/cartController');
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('guest cart sync is idempotent and preserves larger saved quantity', async () => {
  cart.clear();
  const req = { user: { id: 'customer-1' }, body: { items: [
    { productId: 'tracker-1', planDuration: '1 Year', quantity: 2 },
  ] } };
  const first = response();
  await mergeCart(req, first);
  assert.equal(first.body.success, true);
  assert.equal(cart.size, 1);
  await mergeCart(req, response());
  assert.equal([...cart.values()][0].quantity, 2);

  const next = response();
  await mergeCart({ ...req, body: { items: [{ ...req.body.items[0], quantity: 3 }] } }, next);
  assert.equal(next.body.success, true);
  assert.equal([...cart.values()][0].quantity, 3);
});

test('guest cart sync rejects an unavailable product', async () => {
  cart.clear();
  const res = response();
  await mergeCart({ user: { id: 'customer-1' }, body: { items: [
    { productId: 'missing', planDuration: '1 Year', quantity: 1 },
  ] } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(cart.size, 0);
});
