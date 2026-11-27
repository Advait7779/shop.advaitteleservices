const { readSession } = require('../services/sessions');

function requireSession(kind) {
  return async (req, res, next) => {
    try {
      const user = await readSession(req, kind);
      if (!user) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

const accessByRole = {
  OWNER: ['analytics', 'catalog', 'orders', 'customers'],
  CATALOG: ['catalog'],
  FULFILLMENT: ['orders'],
  SUPPORT: ['customers'],
};

const adminPermissions = (user) => {
  const role = user.adminAccess ?? 'OWNER';
  return Object.hasOwn(accessByRole, role) ? [...accessByRole[role]] : [];
};

function requirePermission(permission) {
  return (req, res, next) => {
    if (adminPermissions(req.user).includes(permission)) return next();
    return res.status(403).json({ success: false, message: 'You do not have access to this section.' });
  };
}

module.exports = {
  authenticateUser: requireSession('CUSTOMER'),
  verifyAdmin: requireSession('ADMIN'),
  adminPermissions,
  requirePermission,
};
