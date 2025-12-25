const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config/constants');

// Rate limiter: 5 requests per 10 minutes per IP
const compressRateLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: `Too many requests. Please try again after ${RATE_LIMIT_WINDOW_MS / 60000} minutes.`,
        retryAfter: RATE_LIMIT_WINDOW_MS / 1000
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests allowed per ${RATE_LIMIT_WINDOW_MS / 60000} minutes.`,
            retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        });
    }
});

module.exports = {
    compressRateLimiter
};
