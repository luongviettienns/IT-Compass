import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
const metricsState = {
    startedAt: new Date().toISOString(),
    totalRequests: 0,
    totalErrors: 0,
    totalRateLimited: 0,
    routes: new Map(),
};
const SLOW_REQUEST_THRESHOLD_MS = 1000;
const getRouteKey = (req) => {
    const routePath = req.route?.path;
    if (!routePath) {
        return `${req.method} ${req.path}`;
    }
    const baseUrl = req.baseUrl || '';
    return `${req.method} ${baseUrl}${String(routePath)}`;
};
const updateRouteMetric = ({ routeKey, durationMs, statusCode }) => {
    const current = metricsState.routes.get(routeKey) || {
        hits: 0,
        errors: 0,
        rateLimited: 0,
        totalDurationMs: 0,
        maxDurationMs: 0,
        lastStatusCode: 200,
    };
    current.hits += 1;
    current.totalDurationMs += durationMs;
    current.maxDurationMs = Math.max(current.maxDurationMs, durationMs);
    current.lastStatusCode = statusCode;
    if (statusCode >= 400) {
        current.errors += 1;
    }
    if (statusCode === 429) {
        current.rateLimited += 1;
    }
    metricsState.routes.set(routeKey, current);
};
export const metricsMiddleware = (req, res, next) => {
    res.on('finish', () => {
        const startedAt = req.requestStartedAt || process.hrtime.bigint();
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const routeKey = getRouteKey(req);
        const statusCode = res.statusCode;
        const isSlowRequest = durationMs >= SLOW_REQUEST_THRESHOLD_MS;
        const shouldLogRequest = env.isDevelopment || isSlowRequest || statusCode >= 400 || statusCode === 429;
        metricsState.totalRequests += 1;
        if (statusCode >= 400)
            metricsState.totalErrors += 1;
        if (statusCode === 429)
            metricsState.totalRateLimited += 1;
        updateRouteMetric({ routeKey, durationMs, statusCode });
        if (!shouldLogRequest) {
            return;
        }
        const logMetadata = {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            route: routeKey,
            statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            userId: req.user ? String(req.user.id) : null,
            ipAddress: req.ip || null,
            environment: env.nodeEnv,
        };
        if (statusCode >= 500) {
            logger.error('HTTP request failed', logMetadata);
            return;
        }
        if (statusCode >= 400 || statusCode === 429) {
            logger.warn('HTTP request completed with warning', logMetadata);
            return;
        }
        logger.info('HTTP request completed', {
            ...logMetadata,
            slowRequestThresholdMs: SLOW_REQUEST_THRESHOLD_MS,
        });
    });
    return next();
};
export const getMetricsSnapshot = () => ({
    startedAt: metricsState.startedAt,
    totalRequests: metricsState.totalRequests,
    totalErrors: metricsState.totalErrors,
    totalRateLimited: metricsState.totalRateLimited,
    routes: Array.from(metricsState.routes.entries()).map(([route, value]) => ({
        route,
        hits: value.hits,
        errors: value.errors,
        rateLimited: value.rateLimited,
        averageDurationMs: value.hits > 0 ? Number((value.totalDurationMs / value.hits).toFixed(2)) : 0,
        maxDurationMs: Number(value.maxDurationMs.toFixed(2)),
        lastStatusCode: value.lastStatusCode,
    })),
});
