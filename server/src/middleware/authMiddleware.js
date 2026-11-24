const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'local-development-only-secret' : '');
if (!JWT_SECRET || (process.env.NODE_ENV === 'production' && (JWT_SECRET.length < 32 || JWT_SECRET === 'advait_teleservices_jwt_secret_key_2025_secure'))) {
  throw new Error('Set a strong, unique JWT_SECRET before starting in production.');
}

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session expired.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user) req.user = user;
    }
  } catch (e) {
    // ignore in optional auth
  }
  next();
};

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Admin authorization token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, mobileNumber: true, fullName: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Admin session expired. Please sign in again.' });
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
  verifyAdmin,
  JWT_SECRET,
};
