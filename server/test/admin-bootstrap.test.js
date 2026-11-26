const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { bootstrapAdmin } = require('../src/services/adminBootstrap');

const adminEnv = {
  ADMIN_EMAIL: '  ADMIN@EXAMPLE.COM ',
  ADMIN_MOBILE: '9876543210',
  ADMIN_PASSWORD: 'AUniqueTestPassword123!',
};

test('admin bootstrap needs all three variables and leaves the database untouched otherwise', async () => {
  const prisma = { user: {
    findFirst: () => { throw new Error('unexpected query'); },
    create: () => { throw new Error('unexpected write'); },
  } };
  assert.equal(await bootstrapAdmin(prisma, {}), 'disabled');
  assert.equal(await bootstrapAdmin(prisma, { ...adminEnv, ADMIN_PASSWORD: '' }), 'disabled');
  assert.equal(await bootstrapAdmin(prisma, { ...adminEnv, ADMIN_MOBILE: '' }), 'incomplete');
});

test('admin bootstrap creates a new admin with a hashed password', async () => {
  let created;
  const prisma = { user: {
    findFirst: async () => null,
    create: async ({ data }) => { created = data; },
  } };
  const shortPasswordEnv = { ...adminEnv, ADMIN_PASSWORD: 'short' };
  assert.equal(await bootstrapAdmin(prisma, shortPasswordEnv), 'created');
  assert.equal(created.email, 'admin@example.com');
  assert.equal(created.mobileNumber, adminEnv.ADMIN_MOBILE);
  assert.equal(created.role, 'ADMIN');
  assert.notEqual(created.passwordHash, shortPasswordEnv.ADMIN_PASSWORD);
  assert.equal(await bcrypt.compare(shortPasswordEnv.ADMIN_PASSWORD, created.passwordHash), true);
});

test('admin bootstrap never overwrites an existing admin or promotes a customer', async () => {
  let writes = 0;
  const prisma = { user: {
    findFirst: async () => ({
      email: 'admin@example.com', mobileNumber: adminEnv.ADMIN_MOBILE, role: 'ADMIN',
    }),
    create: async () => { writes += 1; },
  } };
  assert.equal(await bootstrapAdmin(prisma, adminEnv), 'existing');
  prisma.user.findFirst = async () => ({
    email: 'admin@example.com', mobileNumber: adminEnv.ADMIN_MOBILE, role: 'CUSTOMER',
  });
  assert.equal(await bootstrapAdmin(prisma, adminEnv), 'conflict');
  assert.equal(writes, 0);
});
