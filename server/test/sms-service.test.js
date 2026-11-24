const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const originalGet = axios.get;
const smsPath = require.resolve('../src/services/smsService');

const loadService = (overrides = {}) => {
  process.env.NODE_ENV = 'development';
  process.env.SMS_DEV_MODE = 'false';
  process.env.SMS_API_KEY = 'test-only-key';
  process.env.SMS_ROUTE = '38';
  process.env.SMS_SENDER = 'ADAVAT';
  process.env.SMS_TEMPLATE_ID = '1777179542196464728';
  Object.assign(process.env, overrides);
  delete require.cache[smsPath];
  return require(smsPath);
};

test.after(() => {
  axios.get = originalGet;
  delete require.cache[smsPath];
});

test('OTP request uses the approved provider template and server-only key', async () => {
  let request;
  axios.get = async (url, options) => {
    request = { url, options };
    return { data: { status: 'success' } };
  };
  const service = loadService();
  const result = await service.sendOtp('9876543210', '123456', 'Vaibhav Mhamane');

  assert.equal(result.success, true);
  assert.equal(request.url, 'https://appapi.advaitdigital.co.in/api/smsapi');
  assert.deepEqual(request.options.params, {
    key: 'test-only-key', route: '38', sender: 'ADAVAT', number: '9876543210',
    sms: 'Dear Vaibhav, Your Login OTP for Shop Advait is 123456. Please do not share this OTP with anyone.\nRegards,\nAdvait Teleservices.',
    templateid: '1777179542196464728',
  });
  assert.equal(request.options.maxRedirects, 0);
});

test('new customer receives a generic greeting and provider rejection fails delivery', async () => {
  let message;
  axios.get = async (_url, options) => {
    message = options.params.sms;
    return { data: { status: 'failed', message: 'Rejected' } };
  };
  const result = await loadService().sendOtp('9876543210', '654321');
  assert.equal(result.success, false);
  assert.match(message, /^Dear Customer, Your Login OTP for Shop Advait is 654321\./);
});

test('development OTP mode does not call the provider', async () => {
  axios.get = async () => { throw new Error('Provider should not be called'); };
  const result = await loadService({ SMS_DEV_MODE: 'true' }).sendOtp('9876543210', '123456');
  assert.equal(result.channel, 'development');
});
