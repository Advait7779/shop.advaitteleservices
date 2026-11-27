const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { adminPermissions } = require('../middleware/authMiddleware');
const { createSession } = require('../services/sessions');
const { decryptSecret, matchingStep } = require('../services/adminTotp');
const { allowAttempt } = require('../services/authThrottle');
const audit = require('../services/securityAudit');

const publicAdmin = (user) => ({
  id: user.id, email: user.email, fullName: user.fullName,
  role: user.role, permissions: adminPermissions(user),
});

exports.adminLogin = async (req, res) => {
  const { identifier, email, password, code } = req.body || {};
  const loginId = identifier || email;
  if (typeof loginId !== 'string' || !loginId.trim() || loginId.length > 254 ||
      typeof password !== 'string' || !password || password.length > 1024 ||
      typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'Enter your admin login, password and 6-digit authenticator code.' });
  }

  const reject = (actorId) => {
    audit('admin_login_rejected', { actorId });
    return res.status(401).json({ success: false, message: 'Check your administrator credentials and authenticator code.' });
  };

  try {
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN', OR: [{ email: loginId.trim() }, { mobileNumber: loginId.trim() }] },
    });
    if (user) {
      const seconds = await allowAttempt('admin-account', user.id, 8, 15 * 60_000);
      if (seconds) {
        audit('admin_login_limited', { actorId: user.id });
        return res.set('Retry-After', String(seconds)).status(429).json({
          success: false, message: 'Too many attempts. Please try again later.',
        });
      }
    }
    const dummyHash = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.9M/8zPWtqag/lw6RuuIZVhJMSrgG6za';
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash || dummyHash);
    if (!user?.passwordHash || !passwordMatches) return reject(user?.id);
    if (!user.totpSecret) {
      audit('admin_enrollment_needed', { actorId: user.id });
      return res.status(403).json({ success: false, message: 'An administrator must enroll this account in an authenticator app.' });
    }

    const step = matchingStep(decryptSecret(user.totpSecret, user.id), code);
    if (step === null) return reject(user.id);

    const setCookie = await prisma.$transaction(async (tx) => {
      const claimed = await tx.user.updateMany({
        where: {
          id: user.id, role: 'ADMIN', totpSecret: user.totpSecret, passwordHash: user.passwordHash,
          OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }],
        },
        data: { totpLastStep: step },
      });
      if (claimed.count !== 1) return null;
      return createSession(req, res, user, 'ADMIN', tx);
    });
    if (!setCookie) return reject(user.id);
    setCookie();
    audit('admin_login_succeeded', { actorId: user.id });
    return res.json({ success: true, admin: publicAdmin(user) });
  } catch {
    audit('admin_login_error');
    return res.status(503).json({ success: false, message: 'Admin sign-in is unavailable. Please try again later.' });
  }
};

exports.getAdminProfile = (req, res) => res.json({ success: true, admin: publicAdmin(req.user) });
