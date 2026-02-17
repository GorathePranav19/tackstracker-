const rateLimit = require('express-rate-limit');

// Rate limiter specifically for AI endpoints
// More restrictive than general API to protect free tier quota
const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per hour per user
    message: {
        error: 'Too many AI requests. Please wait before trying again.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Key by user ID if authenticated, otherwise by IP
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    },
    skip: (req) => {
        // Skip rate limiting if AI is disabled
        return process.env.AI_ENABLED !== 'true';
    }
});

// Stricter limiter for expensive operations
const aiExpensiveRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message: {
        error: 'This AI feature has a lower rate limit. Please wait before trying again.',
        retryAfter: '1 hour'
    },
    keyGenerator: (req) => req.user?.id || req.ip
});

module.exports = {
    aiRateLimiter,
    aiExpensiveRateLimiter
};
