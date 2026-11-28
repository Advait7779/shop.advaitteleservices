const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const cart = new Map();
const product = {
  id: 'tracker-1',
  slug: 'a5-device',
  category: 'vehicle-gps',
  inStock: true,
  planOptions: ['1 Year'],
};
const nonGpsProduct = {
  id: 'sensor-1',
  slug: 'fuel-sensor-ble',
  category: 'fuel-sensors',
  inStock: true,
  planOptions: ['1 Year'],
};
const bleNoSimProduct = {
  id: 'ble-1',
  slug: 'custom-ble',
  title: 'Custom BLE Sensor',
  category: 'vehicle-gps',
  specs: { connectivity: 'Bluetooth Low Energy (BLE 5.0) — No Separate SIM Needed' },
  inStock: true,
  planOptions: ['1 Year'],
};
const dashcamProduct = {
  id: 'dashcam-1',
  slug: '4g-ai-gps-dashcam',
  title: '4G AI GPS DASHCAM',
  category: 'vehicle-gps',
  specs: { connectivity: '4G LTE + Built-In Wi-Fi Hotspot (Lockable 4G SIM Slot Required)' },
  inStock: true,
  planOptions: ['1 Year'],
};
const catalogById = {
  [product.id]: product,
  [nonGpsProduct.id]: nonGpsProduct,
  [bleNoSimProduct.id]: bleNoSimProduct,
  [dashcamProduct.id]: dashcamProduct,
};
const prisma = {
  $transaction: async (work) => work(prisma),
  product: { findUnique: async ({ where }) => catalogById[where.id] || null },
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

test('SIM option plans are allowed only for GPS trackers and rejected on non-GPS sensors', async () => {
  cart.clear();
  const gpsRes = response();
  await mergeCart({ user: { id: 'customer-1' }, body: { items: [
    { productId: 'tracker-1', planDuration: '1 Year · Airtel SIM', quantity: 1 },
  ] } }, gpsRes);
  assert.equal(gpsRes.statusCode, 200);
  assert.equal(cart.size, 1);

  cart.clear();
  const sensorRes = response();
  await mergeCart({ user: { id: 'customer-1' }, body: { items: [
    { productId: 'sensor-1', planDuration: '1 Year · Airtel SIM', quantity: 1 },
  ] } }, sensorRes);
  assert.equal(sensorRes.statusCode, 409);
  assert.equal(cart.size, 0);

  cart.clear();
  const bleTaggedProductRes = response();
  await mergeCart({ user: { id: 'customer-1' }, body: { items: [
    { productId: 'ble-1', planDuration: '1 Year · Airtel SIM', quantity: 1 },
  ] } }, bleTaggedProductRes);
  assert.equal(bleTaggedProductRes.statusCode, 409);

  cart.clear();
  const dashcamRes = response();
  await mergeCart({ user: { id: 'customer-1' }, body: { items: [
    { productId: 'dashcam-1', planDuration: '1 Year · Airtel SIM', quantity: 1 },
  ] } }, dashcamRes);
  assert.equal(dashcamRes.statusCode, 200);
  assert.equal(cart.size, 1);
});
