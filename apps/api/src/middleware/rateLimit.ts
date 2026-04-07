import rateLimit from 'express-rate-limit';

// Agent action rate limiter — 30 actions per user per minute
export const agentActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req as any).auth?.payload?.sub ?? req.ip ?? 'unknown',
  message: { error: 'rate_limited', message: 'Too many agent actions. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => (req as any).auth?.payload?.sub ?? req.ip ?? 'unknown',
  message: { error: 'rate_limited', message: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});
