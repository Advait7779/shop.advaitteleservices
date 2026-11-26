const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;
try {
  if (process.env.PAYMENTS_ENABLED === 'true') {
    if (!key_id || !key_secret || key_id.includes('placeholder') || key_secret.includes('placeholder')) {
      throw new Error('Payment credentials are not configured');
    }
    razorpayInstance = new Razorpay({ key_id, key_secret });
  }
} catch (err) {
  if (process.env.NODE_ENV === 'production') throw err;
}

module.exports = {
  razorpayInstance,
  key_id,
  key_secret,
};
