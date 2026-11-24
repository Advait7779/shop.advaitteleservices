const test = require('node:test');
const assert = require('node:assert/strict');
const { authenticateUser, verifyAdmin } = require('../src/middleware/authMiddleware');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('customer and admin protected routes reject missing tokens', async () => {
  const customer = response();
  const admin = response();
  await authenticateUser({ headers: {} }, customer, () => assert.fail('authenticated without a token'));
  await verifyAdmin({ headers: {} }, admin, () => assert.fail('admin authenticated without a token'));
  assert.equal(customer.statusCode, 401);
  assert.equal(admin.statusCode, 401);
});
