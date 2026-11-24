require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const mobile = process.env.ADMIN_MOBILE?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^[6-9]\d{9}$/.test(mobile || '') || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL, a 10-digit ADMIN_MOBILE, and ADMIN_PASSWORD (12+ characters) before seeding.');
  }
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { mobileNumber: mobile }] } });
  if (existing && existing.role !== 'ADMIN') {
    throw new Error('The requested admin email or mobile belongs to a customer. Choose different credentials.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const data = {
    email, mobileNumber: mobile, passwordHash, role: 'ADMIN',
    fullName: 'Advait Administrator', addressLine1: 'Advait Teleservices',
    city: 'Pune', pincode: '411028',
  };
  if (existing) await prisma.user.update({ where: { id: existing.id }, data });
  else await prisma.user.create({ data });
  console.log('Administrator account configured.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
