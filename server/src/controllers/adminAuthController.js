const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { adminPermissions } = require('../middleware/authMiddleware');
const { createSession } = require('../services/sessions');
const { allowAttempt } = require('../services/authThrottle');
const audit = require('../services/securityAudit');

const publicAdmin = (user) => ({
  id: user.id, email: user.email, fullName: user.fullName,
  role: user.role, permissions: adminPermissions(user),
});

exports.adminLogin = async (req, res) => {
  const { identifier, email, password } = req.body || {};
  const loginId = identifier || email;
  if (typeof loginId !== 'string' || !loginId.trim() || loginId.length > 254 ||
      typeof password !== 'string' || !password || password.length > 1024) {
    return res.status(400).json({ success: false, message: 'Enter your admin email or mobile number and password.' });
  }

  const reject = (actorId) => {
    audit('admin_login_rejected', { actorId });
    return res.status(401).json({ success: false, message: 'Check your administrator email or mobile number and password.' });
  };

  try {
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN', OR: [{ email: loginId.trim() }, { mobileNumber: loginId.trim() }] },
      select: { id: true, passwordHash: true },
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
    const session = await prisma.$transaction(async (tx) => {
      // Coordinate with password resets so the old password cannot create a session after a reset.
      const [admin] = await tx.$queryRaw`
        SELECT "id", "email", "fullName", "role", "adminAccess"
        FROM "users"
        WHERE "id" = ${user.id} AND "role" = 'ADMIN' AND "passwordHash" = ${user.passwordHash}
        FOR SHARE
      `;
      if (!admin) return null;
      return { admin, setCookie: await createSession(req, res, admin, 'ADMIN', tx) };
    });
    if (!session) return reject(user.id);
    session.setCookie();
    audit('admin_login_succeeded', { actorId: user.id });
    return res.json({ success: true, admin: publicAdmin(session.admin) });
  } catch {
    audit('admin_login_error');
    return res.status(503).json({ success: false, message: 'Admin sign-in is unavailable. Please try again later.' });
  }
};

exports.getAdminProfile = (req, res) => res.json({ success: true, admin: publicAdmin(req.user) });
