require('dotenv').config();
require('./src/config/validateEnv')();
require('./src/config/validateUploadStorage')();
const app = require('./src/app');
const prisma = require('./src/config/db');
const { bootstrapAdmin } = require('./src/services/adminBootstrap');
const { pruneUnusedUploads } = require('./src/services/uploadCleanup');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const adminStatus = await bootstrapAdmin(prisma);
    if (adminStatus === 'created') console.log('Administrator account created.');
    if (adminStatus === 'incomplete') console.warn('Administrator bootstrap skipped: set ADMIN_EMAIL, ADMIN_MOBILE (10 digits), and ADMIN_PASSWORD.');
    if (adminStatus === 'conflict') console.warn('Administrator bootstrap skipped: admin email or mobile is already assigned to another account.');
  } catch (error) {
    console.error('Administrator bootstrap failed:', error);
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Advait Teleservices Backend running on port ${PORT}`);
    console.log(`📦 Database: PostgreSQL`);
    console.log(`📱 SMS OTP Mode: ${process.env.SMS_DEV_MODE === 'true' ? 'Development Mode' : process.env.SMS_API_KEY ? 'Advait Digital' : process.env.SMS_GATEWAY_URL ? 'External Gateway' : 'Unconfigured'}`);
    console.log(`💳 Razorpay: ${process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'Live' : 'Test/Unconfigured'}`);
    console.log(`======================================================\n`);
  });
}

start();

// Files left by interrupted product saves are safe to remove after one day.
const cleanOldUploads = () => pruneUnusedUploads()
  .then((removed) => { if (removed) console.log(`Removed ${removed} unused product images.`); })
  .catch((error) => console.error('Could not clean old product images:', error));
cleanOldUploads();
setInterval(cleanOldUploads, 24 * 60 * 60 * 1000).unref();
