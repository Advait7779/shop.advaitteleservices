const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test-only-secret-longer-than-thirty-two-characters';
const dbPath = require.resolve('../src/config/db');
const stored = new Map();
let loginAdmin;
const prisma = {
  user: { findFirst: async () => loginAdmin },
  $transaction: async (operation) => operation(prisma),
  $executeRaw: async () => 1,
  $queryRaw: async () => loginAdmin ? [loginAdmin] : [],
  authSession: {
    create: async ({ data }) => stored.set(data.tokenHash, data),
    findUnique: async ({ where }) => stored.get(where.tokenHash),
    deleteMany: async ({ where }) => {
      if (stored.get(where.tokenHash)?.kind === where.kind) stored.delete(where.tokenHash);
    },
  },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };
const { createSession, logout, readSession } = require('../src/services/sessions');
const { adminLogin } = require('../src/controllers/adminAuthController');
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

test('admin sign-in requires the correct password and issues a protected session with staff permissions', async () => {
  const password = 'test-password-only';
  loginAdmin = { id: 'admin', email: 'staff@example.com', role: 'ADMIN', adminAccess: 'CATALOG',
    passwordHash: await bcrypt.hash(password, 4) };
  const login = (password, res) => adminLogin({ body: { identifier: loginAdmin.email, password } }, res);
  const denied = response();
  await login('wrong-password', denied);
  assert.equal(denied.statusCode, 401);
  assert.equal(denied.set, undefined);
  const allowed = response();
  await login(password, allowed);
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.set.name, '__Host-advait_admin');
  assert.deepEqual(allowed.body.admin.permissions, ['catalog']);
  assert.equal(allowed.body.admin.passwordHash, undefined);
});

test('cross-site form submissions and staff access outside assigned sections are rejected', () => {
  const form = response();
  protectBrowserWrites({ method: 'POST', get: () => undefined }, form, () => assert.fail());
  assert.equal(form.statusCode, 403);
  const staff = response();
  requirePermission('orders')({ user: { adminAccess: 'CATALOG' } }, staff, () => assert.fail());
  assert.equal(staff.statusCode, 403);
});
