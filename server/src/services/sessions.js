const { createHash, randomBytes } = require('node:crypto');
const prisma = require('../config/db');

const minute = 60_000;
const policies = {
  CUSTOMER: { lifetime: 30 * 24 * 60 * minute, idle: 7 * 24 * 60 * minute, name: 'advait_customer' },
  ADMIN: { lifetime: 8 * 60 * minute, idle: 30 * minute, name: 'advait_admin' },
};

function cookie(kind, req) {
  const secure = process.env.NODE_ENV === 'production' || req.secure === true;
  return {
    name: (secure ? '__Host-' : '') + policies[kind].name,
    options: { httpOnly: true, secure, sameSite: kind === 'ADMIN' ? 'strict' : 'lax', path: '/' },
  };
}

function readToken(req, kind) {
  const { name } = cookie(kind, req);
  const values = (req.headers?.cookie || '').split(';').map((part) => part.trim())
    .filter((part) => part.startsWith(name + '='));
  if (values.length !== 1) return null;
  const token = values[0].slice(name.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

const hash = (token) => createHash('sha256').update(token).digest('hex');

async function createSession(req, res, user, kind, db = prisma) {
  if (user.role !== kind) throw new Error('Unexpected session role.');
  const policy = policies[kind];
  const token = randomBytes(32).toString('base64url');
  const previous = readToken(req, kind);
  const now = Date.now();
  if (previous) await db.authSession.deleteMany({ where: { tokenHash: hash(previous), kind } });
  await db.authSession.create({ data: {
    tokenHash: hash(token), userId: user.id, kind,
    expiresAt: new Date(now + policy.lifetime), idleUntil: new Date(now + policy.idle),
  } });
  return () => {
    const { name, options } = cookie(kind, req);
    res.cookie(name, token, { ...options, maxAge: policy.lifetime });
  };
}

async function readSession(req, kind) {
  const token = readToken(req, kind);
  if (!token) return null;
  const now = Date.now();
  const tokenHash = hash(token);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { user: { select: {
      id: true, role: true, fullName: true, email: true, mobileNumber: true,
      addressLine1: true, addressLine2: true, city: true, pincode: true, adminAccess: true,
    } } },
  });
  if (!session || session.kind !== kind || session.user.role !== kind ||
      session.expiresAt.getTime() <= now || session.idleUntil.getTime() <= now) return null;
  const idle = policies[kind].idle;
  const nextIdle = Math.min(now + idle, session.expiresAt.getTime());
  if (nextIdle - session.idleUntil.getTime() >= Math.min(5 * minute, idle / 4)) {
    await prisma.authSession.updateMany({
      where: { tokenHash, idleUntil: session.idleUntil },
      data: { idleUntil: new Date(nextIdle) },
    });
  }
  return session.user;
}

function logout(kind) {
  return async (req, res) => {
    try {
      const token = readToken(req, kind);
      if (token) await prisma.authSession.deleteMany({ where: { tokenHash: hash(token), kind } });
      const { name, options } = cookie(kind, req);
      res.clearCookie(name, options);
      return res.json({ success: true });
    } catch {
      return res.status(503).json({ success: false, message: 'Could not sign out. Please try again.' });
    }
  };
}

module.exports = { createSession, readSession, logout };
