require('dotenv').config();
require('./src/config/validateEnv')();
require('./src/config/validateUploadStorage')();
const app = require('./src/app');
const { pruneUnusedUploads } = require('./src/services/uploadCleanup');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Advait Teleservices Backend running on port ${PORT}`);
  console.log(`📦 Database: PostgreSQL`);
  console.log(`📱 SMS OTP Mode: ${process.env.SMS_DEV_MODE === 'true' ? 'Development Mode' : process.env.SMS_API_KEY ? 'Advait Digital' : process.env.SMS_GATEWAY_URL ? 'External Gateway' : 'Unconfigured'}`);
  console.log(`💳 Razorpay: ${process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'Live' : 'Test/Unconfigured'}`);
  console.log(`======================================================\n`);
});

// Files left by interrupted product saves are safe to remove after one day.
const cleanOldUploads = () => pruneUnusedUploads()
  .then((removed) => { if (removed) console.log(`Removed ${removed} unused product images.`); })
  .catch((error) => console.error('Could not clean old product images:', error));
cleanOldUploads();
setInterval(cleanOldUploads, 24 * 60 * 60 * 1000).unref();
