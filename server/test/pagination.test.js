const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const calls = {};
const prisma = {
  productCategory: {
    findUnique: async ({ where }) => ['fuel-sensors', 'dash-cameras'].includes(where.id) ? { id: where.id } : null,
  },
  product: {
    findMany: async (args) => { calls.products = args; return [{ id: 'product-1', title: 'Tracker' }]; },
    findUnique: async (args) => { calls.productDetail = args; return { id: 'product-1', description: 'Full description' }; },
    count: async (args) => { calls.productCount = args; return 51; },
    groupBy: async () => [
      { inStock: true, _count: { id: 7 } },
      { inStock: false, _count: { id: 2 } },
    ],
  },
  user: {
    findMany: async (args) => {
      calls.customers = args;
      return [{ id: 'user-1', fullName: 'Customer', createdAt: new Date('2026-01-01') }];
    },
    count: async () => 26,
  },
  order: {
    findMany: async (args) => { calls.orders = args; return [{ id: 'order-1', orderNumber: 'A1' }]; },
    findFirst: async (args) => { calls.orderDetail = args; return { id: 'order-1', shippingAddress: {}, items: [] }; },
    count: async () => 53,
    groupBy: async (args) => {
      (calls.groups ||= []).push(args);
      if (args.by[0] === 'status') return [
        { status: 'PAID', _count: { id: 2 }, _sum: { totalAmount: 1500 } },
        { status: 'PENDING', _count: { id: 1 }, _sum: { totalAmount: 700 } },
      ];
      return args._count ? [{ userId: 'user-1', _count: { id: 3 } }]
        : [{ userId: 'user-1', _sum: { totalAmount: 1500 } }];
    },
  },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };

const adminProducts = require('../src/controllers/adminProductController');
const adminCustomers = require('../src/controllers/adminCustomerController');
const adminOrders = require('../src/controllers/adminOrderController');
const publicProducts = require('../src/controllers/productController');
const adminStats = require('../src/controllers/adminStatsController');
const { parsePagination } = require('../src/utils/pagination');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test.beforeEach(() => {
  for (const key of Object.keys(calls)) delete calls[key];
});

test('pagination rejects invalid and unsafe page sizes', () => {
  assert.deepEqual(parsePagination({ page: '2', limit: '25' }), { page: 2, limit: 25, skip: 25 });
  for (const query of [{ page: '0' }, { page: '1.5' }, { limit: '101' }, { page: '999999999' }]) {
    assert.throws(() => parsePagination(query));
  }
});

test('admin products are bounded and return total metadata with a list projection', async () => {
  const res = response();
  await adminProducts.getAllProductsAdmin({ query: { page: '2', limit: '25' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls.products.take, 25);
  assert.equal(calls.products.skip, 25);
  assert.equal(calls.products.select.description, undefined);
  assert.equal(res.body.totalCount, 51);
  assert.equal(res.body.totalPages, 3);
  assert.equal(res.body.hasNextPage, true);
});

test('customer page aggregates only the displayed customer IDs', async () => {
  const res = response();
  await adminCustomers.getAllCustomersAdmin({ query: { page: '1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls.customers.take, 25);
  assert.equal(calls.customers.include, undefined);
  assert.deepEqual(calls.groups[0].where.userId.in, ['user-1']);
  assert.deepEqual(calls.groups[1].where.userId.in, ['user-1']);
  assert.equal(res.body.customers[0].totalOrders, 3);
  assert.equal(res.body.customers[0].totalSpent, 1500);
});

test('admin orders list omits detail-only and payment fields', async () => {
  const res = response();
  await adminOrders.getAllOrdersAdmin({ query: { page: '2', limit: '25' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls.orders.skip, 25);
  assert.equal(calls.orders.take, 25);
  assert.equal(calls.orders.select.shippingAddress, undefined);
  assert.equal(calls.orders.select.razorpaySignature, undefined);
  assert.equal(calls.orders.select.items.select.productTitle, true);
  assert.equal(res.body.totalPages, 3);
});

test('customer order history is bounded to the signed-in customer', async () => {
  const orderController = require('../src/controllers/orderController');
  const res = response();
  await orderController.getMyOrders({ user: { id: 'user-1' }, query: { page: '2' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls.orders.where.userId, 'user-1');
  assert.equal(calls.orders.take, 10);
  assert.equal(calls.orders.skip, 10);
  assert.equal(calls.orders.select.shippingAddress, undefined);
});

test('public catalog is bounded for shop and homepage requests', async () => {
  const res = response();
  await publicProducts.getAllProducts({ query: { limit: '6' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls.products.take, 6);
  assert.equal(calls.products.skip, 0);
  assert.equal(res.body.hasNextPage, true);
});

test('catalog category, search, and sort share one filtered pagination query', async () => {
  const res = response();
  await publicProducts.getAllProducts({ query: {
    category: 'fuel-sensors', search: 'BLE', sort: 'price-asc', page: '2', limit: '6',
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls.products.skip, 6);
  assert.equal(calls.products.take, 6);
  assert.deepEqual(calls.products.where, calls.productCount.where);
  assert.equal(calls.products.where.category, 'fuel-sensors');
  assert.equal(calls.products.where.OR[0].title.contains, 'BLE');
  assert.equal(calls.products.orderBy[0].sellingPrice, 'asc');

  const custom = response();
  await publicProducts.getAllProducts({ query: { category: 'dash-cameras' } }, custom);
  assert.equal(custom.statusCode, 200);
  assert.equal(calls.products.where.category, 'dash-cameras');

  const invalid = response();
  await publicProducts.getAllProducts({ query: { category: 'unknown' } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

test('detail endpoints retain full editor and order drawer data', async () => {
  const productRes = response();
  await adminProducts.getProductByIdAdmin({ params: { id: 'product-1' } }, productRes);
  assert.equal(productRes.body.product.description, 'Full description');
  const orderRes = response();
  await adminOrders.getOrderByIdAdmin({ params: { id: 'order-1' } }, orderRes);
  assert.equal(orderRes.body.order.id, 'order-1');
  assert.equal(calls.orderDetail.include.items, true);
});

test('dashboard derives counts and paid revenue from four grouped queries', async () => {
  const res = response();
  await adminStats.getAdminDashboardStats({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.stats.totalOrders, 3);
  assert.equal(res.body.stats.totalRevenue, 1500);
  assert.equal(res.body.stats.totalProducts, 9);
  assert.equal(res.body.stats.inStockProducts, 7);
  assert.equal(calls.orders.take, 5);
  assert.equal(calls.orders.select.shippingAddress, undefined);
});
