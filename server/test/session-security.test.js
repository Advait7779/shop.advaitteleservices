const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test-only-secret-longer-than-thirty-two-characters';
const dbPath = require.resolve('../src/config/db');
const stored = new Map();
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: {
    authSession: {
      create: async ({ data }) => stored.set(data.tokenHash, data),
      findUnique: async ({ where }) => stored.get(where.tokenHash),
      deleteMany: async ({ where }) => {
        if (stored.get(where.tokenHash)?.kind === where.kind) stored.delete(where.tokenHash);
      },
    },
  },
};
const { createSession, logout, readSession } = require('../src/services/sessions');
const { matchingStep, encryptSecret, decryptSecret } = require('../src/services/adminTotp');
const { requirePermission } = require('../src/middleware/authMiddleware');
const { protectBrowserWrites } = require('../src/middleware/browserSecurity');

const response = () => ({
  statusCode: 200,
  cookie(name, value, options) { this.set = { name, value, options }; },
  clearCookie(name) { this.cleared = name; },
  json(value) { this.body = value; },
  status(code) { this.statusCode = code; return this; },
});

test('admin session cookies are protected, stored as hashes, and revoked at logout', async () => {
  const user = { id: 'admin', role: 'ADMIN' };
  const res = response();
  (await createSession({ headers: {} }, res, user, 'ADMIN'))();
  const { name, value, options } = res.set;
  assert.equal(name, '__Host-advait_admin');
  assert.equal(options.secure, true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'strict');
  assert.equal(stored.has(value), false);
  stored.get(createHash('sha256').update(value).digest('hex')).user = user;

  const req = { headers: { cookie: name + '=' + value } };
  assert.equal(await readSession(req, 'ADMIN'), user);
  assert.equal(await readSession({ headers: { cookie: '__Host-advait_customer=' + value } }, 'CUSTOMER'), null);
  await logout('ADMIN')(req, res);
  assert.equal(res.cleared, name);
  assert.equal(await readSession(req, 'ADMIN'), null);
});

test('authenticator verification matches the RFC 6238 SHA-1 vector and the seed is bound to the admin', () => {
  const sample = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(matchingStep(sample, '287082', 59_000), 1);
  assert.equal(matchingStep(sample, '287082', 119_000), null);
  const encrypted = encryptSecret(sample, 'admin-a');
  assert.equal(decryptSecret(encrypted, 'admin-a'), sample);
  assert.throws(() => decryptSecret(encrypted, 'admin-b'));
});

test('cross-site form submissions and staff access outside assigned sections are rejected', () => {
  const form = response();
  protectBrowserWrites({ method: 'POST', get: () => undefined }, form, () => assert.fail());
  assert.equal(form.statusCode, 403);
  const staff = response();
  requirePermission('orders')({ user: { adminAccess: 'CATALOG' } }, staff, () => assert.fail());
  assert.equal(staff.statusCode, 403);
});
