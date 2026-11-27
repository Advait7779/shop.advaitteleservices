const { createHmac } = require('node:crypto');
const prisma = require('../config/db');
const { JWT_SECRET } = require('../config/sessionSecret');

async function allowAttempt(scope, identity, maximum, windowMs) {
  const now = new Date();
  const start = Math.floor(now.getTime() / windowMs) * windowMs;
  const expiresAt = new Date(start + windowMs);
  const key = createHmac('sha256', JWT_SECRET)
    .update(JSON.stringify([scope, identity, start])).digest('hex');
  const changed = await prisma.$executeRaw`
    INSERT INTO "auth_rate_limits" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET "count" = "auth_rate_limits"."count" + 1
    WHERE "auth_rate_limits"."count" < ${maximum}
  `;
  return changed === 1 ? 0 : Math.max(1, Math.ceil((expiresAt - now) / 1000));
}

function sharedAuthLimit(scope, maximum, windowMs) {
  return async (req, res, next) => {
    try {
      const seconds = await allowAttempt(scope, req.ip || 'unknown', maximum, windowMs);
      if (seconds) return res.set('Retry-After', String(seconds)).status(429).json({
        success: false, message: 'Too many attempts. Please try again later.',
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { allowAttempt, sharedAuthLimit };
