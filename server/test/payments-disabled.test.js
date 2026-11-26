const test = require('node:test');
const assert = require('node:assert/strict');

test('production starts without Razorpay keys only when payments are disabled', () => {
  const names = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'SMS_API_KEY', 'SMS_GATEWAY_URL',
    'SMS_DEV_MODE', 'SMS_NOTIFICATION_URL', 'PAYMENTS_ENABLED', 'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    Object.assign(process.env, {
      NODE_ENV: 'production', DATABASE_URL: 'postgresql://test:pass@db:5432/shop',
      JWT_SECRET: '0123456789abcdef0123456789abcdef', SMS_API_KEY: 'test-sms-key',
      SMS_DEV_MODE: 'false', PAYMENTS_ENABLED: 'false',
    });
    for (const name of ['SMS_GATEWAY_URL', 'SMS_NOTIFICATION_URL', 'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']) delete process.env[name];
    const validateEnv = require('../src/config/validateEnv');
    assert.doesNotThrow(validateEnv);
    assert.equal(require('../src/config/razorpay').razorpayInstance, null);
    delete process.env.PAYMENTS_ENABLED;
    assert.doesNotThrow(validateEnv);
    process.env.PAYMENTS_ENABLED = 'true';
    assert.throws(validateEnv, /Missing required production setting: RAZORPAY_KEY_ID/);
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
