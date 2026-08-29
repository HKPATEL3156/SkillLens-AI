// Simple in-memory rate limiter for administrative APIs (per-IP)
// Note: For production, replace with a robust store-based limiter (Redis, etc.)
const LRU = new Map();

module.exports = function (opts = {}) {
  const windowMs = opts.windowMs || 60 * 1000; // default 1 minute
  const max = opts.max || 60; // max requests per window per IP

  return (req, res, next) => {
    try {
      const key = req.ip || req.connection.remoteAddress || "global";
      const now = Date.now();
      const entry = LRU.get(key) || { count: 0, resetAt: now + windowMs };
      if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + windowMs;
      }
      entry.count += 1;
      LRU.set(key, entry);
      if (entry.count > max) {
        res
          .status(429)
          .json({ error: "Too many requests. Please try again later." });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
