require('dotenv').config({ quiet: true });
const prisma = require('../src/config/db');
const { adminAccessRoles } = require('../src/middleware/authMiddleware');
const audit = require('../src/services/securityAudit');

async function setAdminAccess() {
  const [login, access, extra] = process.argv.slice(2);
  const identifier = login?.trim();
  if (!identifier || !adminAccessRoles.includes(access) || extra !== undefined) {
    throw new Error('Usage: node prisma/setAdminAccess.js <admin-email-or-mobile> <' + adminAccessRoles.join('|') + '>');
  }
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN', OR: [{ email: identifier }, { mobileNumber: identifier }] },
    select: { id: true },
  });
  if (!user) throw new Error('No administrator matched that login.');

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id, role: 'ADMIN' }, data: { adminAccess: access } });
    await tx.authSession.deleteMany({ where: { userId: user.id, kind: 'ADMIN' } });
  });
  audit('admin_access_changed', { actorId: user.id });
  console.log('Administrator access updated. The administrator can sign in again.');
}

setAdminAccess().catch((error) => {
  console.error(error.name === 'Error' ? error.message : 'Could not update administrator access.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
