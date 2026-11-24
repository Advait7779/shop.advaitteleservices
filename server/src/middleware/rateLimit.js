const buckets = new Map();

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.path}:${req.ip}`;
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 10000) {
      for (const [storedKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(storedKey);
      }
    }

    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.' });
    }
    return next();
  };
}

module.exports = rateLimit;
