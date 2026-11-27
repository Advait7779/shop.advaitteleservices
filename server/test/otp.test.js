const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test-only-secret-longer-than-thirty-two-characters';
const dbPath = require.resolve('../src/config/db');
const smsPath = require.resolve('../src/services/smsService');
let user;
let storedOtp;
let sentCode;
let userUpdates = 0;
let userCreates = 0;
let quotaAllowed = true;
let deliverySucceeds = true;
let releasedSlots = 0;
const prisma = {
  $transaction: async (work) => work(prisma),
  authSession: {
    create: async () => {},
  },
  user: {
    findUnique: async () => user,
    update: async () => { userUpdates += 1; return user; },
    create: async ({ data }) => { userCreates += 1; user = { id: 'new-user', role: 'CUSTOMER', email: null, ...data }; return user; },
  },
  otpVerification: {
    count: async () => 0,
    updateMany: async () => ({ count: 1 }),
    update: async () => ({ id: 'otp-1' }),
    create: async ({ data }) => { storedOtp = data; return { id: 'otp-1' }; },
    findFirst: async () => storedOtp && { id: 'otp-1', otpCode: storedOtp.otpCode, attempts: 0 },
  },
  otpRequestQuota: {
    createMany: async () => ({ count: 2 }),
    updateMany: async ({ data }) => {
      if (data.count.decrement) releasedSlots += 1;
      return { count: quotaAllowed ? 1 : 0 };
    },
  },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };
require.cache[smsPath] = {
  id: smsPath, filename: smsPath, loaded: true,
  exports: { sendOtp: async (_mobile, code) => { sentCode = code; return { success: deliverySucceeds }; } },
};
const controller = require('../src/controllers/authController');
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  set(name, value) { this.headers = { ...this.headers, [name]: value }; return this; },
  cookie(name, value, options) { this.sessionCookie = { name, value, options }; return this; },
  json(body) { this.body = body; return this; },
});

test('customer OTP is not returned in production and is stored as a hash', async () => {
  user = null;
  sentCode = null;
  const res = response();
  await controller.sendOtp({ body: { mobileNumber: '9876543210' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.devOtp, undefined);
  assert.match(sentCode, /^\d{6}$/);
  assert.match(storedOtp.otpCode, /^[a-f0-9]{64}$/);
  assert.notEqual(storedOtp.otpCode, sentCode);
});

test('customer OTP endpoints reject mobile numbers outside the 10-digit Indian format', async () => {
  user = null;
  sentCode = null;
  const previousOtp = storedOtp;
  const invalidNumbers = [
    '987654321',
    '98765432100',
    '+919876543210',
    '919876543210',
    '+447911123456',
    '98765-43210',
    '9876543210\n',
    '5876543210',
    9876543210,
  ];

  for (const mobileNumber of invalidNumbers) {
    const send = response();
    await controller.sendOtp({ body: { mobileNumber } }, send);
    assert.equal(send.statusCode, 400, JSON.stringify(mobileNumber));
    assert.match(send.body.message, /10-digit Indian mobile number/);

    const verify = response();
    await controller.verifyOtp({ body: { mobileNumber, otpCode: '123456' } }, verify);
    assert.equal(verify.statusCode, 400, JSON.stringify(mobileNumber));
    assert.match(verify.body.message, /10-digit Indian mobile number/);
  }

  assert.equal(sentCode, null);
  assert.equal(storedOtp, previousOtp);
});

test('administrator phone cannot receive a customer OTP', async () => {
  user = { role: 'ADMIN' };
  sentCode = null;
  const res = response();
  await controller.sendOtp({ body: { mobileNumber: '9876543210' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(sentCode, null);
  assert.equal(res.body.devOtp, undefined);
});

test('daily quota blocks sending another OTP with a retry time', async () => {
  user = null;
  sentCode = null;
  quotaAllowed = false;
  const res = response();
  await controller.sendOtp({ ip: '203.0.113.1', body: { mobileNumber: '9876543210' } }, res);
  quotaAllowed = true;
  assert.equal(res.statusCode, 429);
  assert.match(res.body.message, /Daily OTP limit/);
  assert.ok(Number(res.headers['Retry-After']) > 0);
  assert.equal(sentCode, null);
});

test('failed SMS delivery releases both daily slots', async () => {
  user = null;
  releasedSlots = 0;
  deliverySucceeds = false;
  const res = response();
  await controller.sendOtp({ ip: '203.0.113.1', body: { mobileNumber: '9876543210' } }, res);
  deliverySucceeds = true;
  assert.equal(res.statusCode, 503);
  assert.equal(releasedSlots, 2);
});

test('returning customer signs in with mobile and OTP without changing saved details', async () => {
  user = { id: 'existing-user', role: 'CUSTOMER', fullName: 'Saved Name', mobileNumber: '9876543210',
    addressLine1: 'Saved Address', addressLine2: '', city: 'Pune', pincode: '411028' };
  userUpdates = 0;
  const sent = response();
  await controller.sendOtp({ body: { mobileNumber: '9876543210' } }, sent);
  assert.equal(sent.statusCode, 200);
  const verified = response();
  await controller.verifyOtp({ body: { mobileNumber: '9876543210', otpCode: sentCode,
    fullName: 'Wrong Name', addressLine1: 'Wrong Address' } }, verified);
  assert.equal(verified.statusCode, 200);
  assert.equal(verified.body.token, undefined);
  assert.equal(verified.sessionCookie.options.httpOnly, true);
  assert.equal(verified.body.user.fullName, 'Saved Name');
  assert.equal(userUpdates, 0);
});

test('new customer verifies OTP before registering once', async () => {
  user = null;
  userCreates = 0;
  const sent = response();
  await controller.sendOtp({ body: { mobileNumber: '9876543210' } }, sent);
  const verified = response();
  await controller.verifyOtp({ body: { mobileNumber: '9876543210', otpCode: sentCode } }, verified);
  assert.equal(verified.body.registrationRequired, true);
  assert.equal(verified.body.token, undefined);
  assert.equal(userCreates, 0);

  const invalid = response();
  await controller.completeRegistration({ body: { registrationToken: verified.body.registrationToken,
    fullName: ' ' } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(userCreates, 0);

  const registered = response();
  await controller.completeRegistration({ body: { registrationToken: verified.body.registrationToken,
    fullName: 'New Customer' } }, registered);
  assert.equal(registered.statusCode, 201);
  assert.equal(registered.body.user.mobileNumber, '9876543210');
  assert.equal(registered.body.user.addressLine1, undefined);
  assert.equal(registered.body.token, undefined);
  assert.equal(registered.sessionCookie.options.httpOnly, true);
  assert.equal(userCreates, 1);
});
