const bcrypt = require('bcryptjs');

async function bootstrapAdmin(prisma, env = process.env) {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const mobile = env.ADMIN_MOBILE?.trim();
  const password = env.ADMIN_PASSWORD;

  // Removing the one-time bootstrap password disables future attempts.
  if (!password) return 'disabled';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[6-9]\d{9}$/.test(mobile || '')) {
    return 'incomplete';
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { mobileNumber: mobile }] },
  });
  if (existing) {
    if (existing.role === 'ADMIN' && existing.email === email && existing.mobileNumber === mobile) {
      return 'existing';
    }
    return 'conflict';
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      mobileNumber: mobile,
      passwordHash,
      role: 'ADMIN',
      fullName: 'Advait Administrator',
      addressLine1: 'Advait Teleservices',
      city: 'Pune',
      pincode: '411028',
    },
  });
  return 'created';
}

module.exports = { bootstrapAdmin };
