require('dotenv').config({ quiet: true });
const { createInterface } = require('node:readline/promises');
const prisma = require('../src/config/db');
const { enrollmentSecret, encryptSecret, matchingStep } = require('../src/services/adminTotp');
const audit = require('../src/services/securityAudit');

async function enroll() {
  const [identifier, access] = process.argv.slice(2);
  if (!identifier || (access && !['OWNER', 'CATALOG', 'FULFILLMENT', 'SUPPORT'].includes(access))) {
    throw new Error('Usage: node prisma/enrollAdminTotp.js <admin-email-or-mobile> [OWNER|CATALOG|FULFILLMENT|SUPPORT]');
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Run this command in a private interactive terminal.');
  }
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN', OR: [{ email: identifier }, { mobileNumber: identifier }] },
    select: { id: true, fullName: true, totpSecret: true },
  });
  if (!user) throw new Error('No administrator matched that login.');

  const secret = enrollmentSecret();
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('Add a time-based account named Shop Advait in your authenticator app.');
    console.log('Private setup key:', secret);
    const code = (await prompt.question('Enter the current code from the app to confirm: ')).trim();
    const step = matchingStep(secret, code);
    if (step === null) throw new Error('The code did not match. No enrollment changes were saved.');

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id, totpSecret: user.totpSecret, role: 'ADMIN' },
        data: { totpSecret: encryptSecret(secret, user.id), totpLastStep: step, ...(access && { adminAccess: access }) },
      });
      await tx.authSession.deleteMany({ where: { userId: user.id, kind: 'ADMIN' } });
    });
    audit('admin_authenticator_enrolled', { actorId: user.id });
    console.log('Authenticator saved. Sign in using the next code displayed in the app.');
  } finally {
    prompt.close();
  }
}

enroll().catch((error) => {
  if (error.code || error.name === 'PrismaClientInitializationError') {
    console.error('Could not save enrollment. Check the database and try again.');
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
