const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'local-development-only-secret' : '');
if (!JWT_SECRET || (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32)) {
  throw new Error('Set a strong, unique JWT_SECRET before starting in production.');
}

module.exports = { JWT_SECRET };
