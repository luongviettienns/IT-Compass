import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';
import { HttpError } from '../utils/httpError.js';
const stores = new Map();
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || 'unknown';
};
const getStore = (name) => {
    if (!stores.has(name)) {
        stores.set(name, new Map());
    }
    return stores.get(name);
};
const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
const normalizeIdentity = (value, fallback = 'anonymous') => {
    if (typeof value !== 'string') {
        return fallback;
    }
    const normalized = value.trim().toLowerCase();
    return normalized || fallback;
};
const buildBucketKey = (name, key) => `${name}:${String(key)}`;
const setRateLimitHeaders = (res, state) => {
    const retryAfterSeconds = Math.max(0, Math.ceil((state.resetAt - Date.now()) / 1000));
    res.setHeader('X-RateLimit-Limit', String(state.limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, state.remaining)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(state.resetAt / 1000)));
    res.setHeader('Retry-After', String(retryAfterSeconds));
};
const consumeFromMemoryStore = ({ name, key, windowMs, maxRequests, }) => {
    const now = Date.now();
    const store = getStore(name);
    const bucketKey = buildBucketKey(name, key);
    const current = store.get(bucketKey);
    if (!current || current.resetAt <= now) {
        const nextState = {
            count: 1,
            resetAt: now + windowMs,
        };
        store.set(bucketKey, nextState);
        return {
            limit: maxRequests,
            remaining: maxRequests - 1,
            resetAt: nextState.resetAt,
            exceeded: false,
            source: 'memory',
        };
    }
    if (current.count >= maxRequests) {
        return {
            limit: maxRequests,
            remaining: 0,
            resetAt: current.resetAt,
            exceeded: true,
            source: 'memory',
        };
    }
    current.count += 1;
    store.set(bucketKey, current);
    return {
        limit: maxRequests,
        remaining: maxRequests - current.count,
        resetAt: current.resetAt,
        exceeded: false,
        source: 'memory',
    };
};
const consumeFromRedisStore = async ({ name, key, windowMs, maxRequests, }) => {
    const client = await getRedisClient();
    if (!client) {
        return null;
    }
    const bucketKey = buildBucketKey(name, key);
    const count = await client.incr(bucketKey);
    if (count === 1) {
        await client.pExpire(bucketKey, windowMs);
    }
    const ttlMs = Number(await client.pTTL(bucketKey));
    const requestCount = Number(count);
    const resetAt = Date.now() + Math.max(ttlMs, 0);
    return {
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - requestCount),
        resetAt,
        exceeded: requestCount > maxRequests,
        source: 'redis',
    };
};
export const createRateLimiter = ({ name, windowMs, maxRequests, code = 'RATE_LIMITED', message = 'Too many requests, please try again later.', keyGenerator, }) => {
    return async (req, res, next) => {
        try {
            const key = keyGenerator ? keyGenerator(req) : getClientIp(req);
            const rateLimitState = env.rateLimitUseRedis
                ? (await consumeFromRedisStore({ name, key, windowMs, maxRequests })) ||
                    consumeFromMemoryStore({ name, key, windowMs, maxRequests })
                : consumeFromMemoryStore({ name, key, windowMs, maxRequests });
            setRateLimitHeaders(res, rateLimitState);
            if (rateLimitState.exceeded) {
                return next(new HttpError(429, message, undefined, code));
            }
            return next();
        }
        catch (error) {
            return next(error);
        }
    };
};
export const authRegisterLimiter = createRateLimiter({
    name: 'auth-register',
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    code: 'AUTH_REGISTER_RATE_LIMITED',
    message: 'Too many registration attempts. Please try again later.',
    keyGenerator: (req) => {
        const ip = getClientIp(req);
        const email = normalizeIdentity(req.body?.email, 'unknown-email');
        return `${ip}:${hashValue(email)}`;
    },
});
export const authLoginLimiter = createRateLimiter({
    name: 'auth-login',
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    code: 'AUTH_LOGIN_RATE_LIMITED',
    message: 'Too many login attempts. Please try again in 15 minutes.',
    keyGenerator: (req) => {
        const ip = getClientIp(req);
        const email = normalizeIdentity(req.body?.email, 'unknown-email');
        return `${ip}:${hashValue(email)}`;
    },
});
export const authRefreshLimiter = createRateLimiter({
    name: 'auth-refresh',
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
    code: 'AUTH_REFRESH_RATE_LIMITED',
    message: 'Too many session refresh attempts. Please try again shortly.',
    // Refresh token được rotate sau mỗi lần thành công, nên key theo IP để không bị reset bucket liên tục.
    keyGenerator: (req) => getClientIp(req),
});
export const passwordResetRequestLimiter = createRateLimiter({
    name: 'password-reset-request',
    windowMs: 15 * 60 * 1000,
    maxRequests: 3,
    code: 'AUTH_PASSWORD_RESET_REQUEST_RATE_LIMITED',
    message: 'Too many password reset requests. Please try again later.',
    keyGenerator: (req) => {
        const ip = getClientIp(req);
        const email = normalizeIdentity(req.body?.email, 'unknown-email');
        return `${ip}:${hashValue(email)}`;
    },
});
export const passwordResetConfirmLimiter = createRateLimiter({
    name: 'password-reset-confirm',
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    code: 'AUTH_PASSWORD_RESET_CONFIRM_RATE_LIMITED',
    message: 'Too many password reset attempts. Please try again later.',
    keyGenerator: (req) => {
        const ip = getClientIp(req);
        const token = normalizeIdentity(req.body?.token, 'unknown-token');
        return `${ip}:${hashValue(token)}`;
    },
});
export const verifyEmailRequestLimiter = createRateLimiter({
    name: 'verify-email-request',
    windowMs: 10 * 60 * 1000,
    maxRequests: 3,
    code: 'AUTH_VERIFY_EMAIL_REQUEST_RATE_LIMITED',
    message: 'Too many email verification requests. Please try again later.',
    keyGenerator: (req) => (req.user?.id ? `user:${String(req.user.id)}` : getClientIp(req)),
});
export const verifyEmailConfirmLimiter = createRateLimiter({
    name: 'verify-email-confirm',
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    code: 'AUTH_VERIFY_EMAIL_CONFIRM_RATE_LIMITED',
    message: 'Too many email verification attempts. Please try again later.',
    keyGenerator: (req) => {
        const ip = getClientIp(req);
        const token = normalizeIdentity(req.body?.token, 'unknown-token');
        return `${ip}:${hashValue(token)}`;
    },
});
export const commentCreateLimiter = createRateLimiter({
    name: 'blog-comment-create',
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
    code: 'BLOG_COMMENT_RATE_LIMITED',
    message: 'Too many comments in a short time. Please try again later.',
    keyGenerator: (req) => {
        if (req.user?.id) {
            return `user:${String(req.user.id)}`;
        }
        const ip = getClientIp(req);
        const guestName = normalizeIdentity(req.body?.guestName, 'guest');
        return `${ip}:${hashValue(guestName)}`;
    },
});
export const uploadImageLimiter = createRateLimiter({
    name: 'upload-image',
    windowMs: 10 * 60 * 1000,
    maxRequests: 20,
    code: 'UPLOAD_RATE_LIMITED',
    message: 'Too many image uploads in a short time. Please try again later.',
    keyGenerator: (req) => (req.user?.id ? `user:${String(req.user.id)}` : getClientIp(req)),
});
