module.exports = function validateEnv() {
  if (process.env.NODE_ENV !== 'production') return;
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  if (paymentsEnabled) required.push('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET');
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required production setting: ${key}`);
  }
  if (!process.env.SMS_API_KEY && !process.env.SMS_GATEWAY_URL) {
    throw new Error('Set SMS_API_KEY or SMS_GATEWAY_URL for production OTP delivery.');
  }
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'advait_teleservices_jwt_secret_key_2025_secure') {
    throw new Error('JWT_SECRET must be a new random secret of at least 32 characters.');
  }
  if (process.env.SMS_DEV_MODE === 'true') throw new Error('SMS_DEV_MODE must be disabled in production.');
  if (!process.env.SMS_API_KEY && process.env.SMS_GATEWAY_URL) {
    if (!process.env.SMS_GATEWAY_URL.startsWith('https://')) throw new Error('SMS_GATEWAY_URL must use HTTPS.');
    if (!/\{mobile\}|\{phone\}/i.test(process.env.SMS_GATEWAY_URL) || !/\{message\}|\{otp\}|\{code\}/i.test(process.env.SMS_GATEWAY_URL)) {
      throw new Error('SMS_GATEWAY_URL must contain phone and OTP/message placeholders.');
    }
  }
  if (process.env.SMS_NOTIFICATION_URL && (!process.env.SMS_NOTIFICATION_URL.startsWith('https://') ||
      !/\{mobile\}|\{phone\}/i.test(process.env.SMS_NOTIFICATION_URL) || !/\{message\}/i.test(process.env.SMS_NOTIFICATION_URL))) {
    throw new Error('SMS_NOTIFICATION_URL must use HTTPS with phone and message placeholders.');
  }
  if (paymentsEnabled && (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_live_') || process.env.RAZORPAY_KEY_SECRET.includes('placeholder'))) {
    throw new Error('Live Razorpay credentials are required in production.');
  }
  if (process.env.DATABASE_URL.includes('localhost')) throw new Error('Use the Coolify PostgreSQL connection URL.');
};
