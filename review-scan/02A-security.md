# ITCompass Security Audit

## Executive summary

I reviewed the backend and frontend paths that are most relevant to authentication, authorization, input validation, uploads, metrics, and runtime hardening.

### High-priority findings

1. **Debug token exposure can leak password reset / email verification tokens in production**.
2. **Rate limiting trusts a client-controlled IP header, which makes auth throttling bypassable**.
3. **Rate limiting fails open to per-process memory when Redis is unavailable**.
4. **The internal metrics endpoint is effectively public when `METRICS_TOKEN` is unset**.
5. **Baseline security headers are missing from the Express app**.

### Dependency review

- Ran `npm audit --omit=dev` in both backend and frontend workspaces.
- **Result:** no known moderate, high, or critical dependency vulnerabilities were reported during the audit run.

---

## Findings

### 1) Debug token exposure can leak password reset and email verification tokens

- **Severity:** High
- **CVSS:** 8.8
- **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)
- **Locations:**
  - `C:\Users\TK\Desktop\DoAn3\backend\src\config\env.ts:151-159`
  - `C:\Users\TK\Desktop\DoAn3\backend\src\services\auth.service.ts:47-49, 220-255`
  - `C:\Users\TK\Desktop\DoAn3\backend\.env.example:12`

**Why this matters**

`AUTH_DEBUG_EXPOSE_TOKENS` is treated as a normal runtime flag and is not blocked in production. If it is left enabled, the public forgot-password and verify-email flows can return the raw token in the JSON response instead of only sending it by email. That turns a normal recovery flow into an account takeover primitive for anyone who knows the victim's email address.

**Attack scenario / PoC**

1. Deploy with `AUTH_DEBUG_EXPOSE_TOKENS=true`.
2. Send `POST /api/auth/forgot-password` for a verified email address.
3. The API response includes the password reset token.
4. Use that token with `POST /api/auth/reset-password` to change the password immediately.

The same issue applies to `POST /api/auth/verify-email/request`.

**Remediation**

- Forbid debug token exposure in production.
- Default the flag to `false` in `.env.example`.
- Fail fast if the flag is enabled in production.
- Keep debug token exposure only in local development and test environments.

**Code example**

```ts
const requestedDebugTokenExposure = parseBoolean(process.env.AUTH_DEBUG_EXPOSE_TOKENS, false);

if (isProduction && requestedDebugTokenExposure) {
  throw new Error('AUTH_DEBUG_EXPOSE_TOKENS must be false in production');
}

const resolvedEnv: AppEnv = {
  // ...
  authDebugExposeTokens: !isProduction && requestedDebugTokenExposure,
  // ...
};
```

---

### 2) Rate limiting trusts a client-controlled IP header, enabling brute-force bucket sharding

- **Severity:** High
- **CVSS:** 8.1
- **CWE:** CWE-807 (Reliance on Untrusted Inputs in a Security Decision) / CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **Locations:**
  - `C:\Users\TK\Desktop\DoAn3\backend\src\app.ts:64-69`
  - `C:\Users\TK\Desktop\DoAn3\backend\src\middlewares\rate-limit.middleware.ts:33-39, 171-177, 198-215, 234-251`

**Why this matters**

`getClientIp()` prefers `req.headers['x-forwarded-for']` directly, before falling back to `req.ip`. That header is user-controlled unless it is stripped and rewritten by a trusted reverse proxy. The auth limiters then key buckets on `ip + email/token`, so an attacker can rotate the header value and keep getting fresh buckets.

**Attack scenario / PoC**

Send repeated login attempts with different `X-Forwarded-For` values:

```bash
curl -X POST https://api.example.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Forwarded-For: 1.1.1.1' \
  --data '{"email":"victim@example.com","password":"wrong"}'

curl -X POST https://api.example.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Forwarded-For: 2.2.2.2' \
  --data '{"email":"victim@example.com","password":"wrong"}'
```

Each request lands in a different rate-limit bucket, so the 5-attempt limit is no longer effective.

**Remediation**

- Stop reading `x-forwarded-for` manually.
- Use `req.ip` only after configuring `trust proxy` to trusted proxy CIDRs.
- Prefer server-side identifiers for abuse control when available.
- Keep rate-limit keys stable and derived from trusted server state.

**Code example**

```ts
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']); // or explicit proxy CIDRs

const getClientIp = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};
```

---

### 3) Redis rate limiting fails open to per-process memory when Redis is unavailable

- **Severity:** Medium
- **CVSS:** 6.5
- **CWE:** CWE-693 (Protection Mechanism Failure)
- **Locations:**
  - `C:\Users\TK\Desktop\DoAn3\backend\src\middlewares\rate-limit.middleware.ts:137-177`
  - `C:\Users\TK\Desktop\DoAn3\backend\src\config\redis.ts:25-58`

**Why this matters**

When Redis is missing or temporarily unreachable, the rate limiter silently falls back to an in-memory store. In a multi-instance deployment that means each node has its own counter, which weakens login, registration, password reset, and comment throttling. This is an availability-first design, but it is a security downgrade for auth-sensitive endpoints.

**Attack scenario / PoC**

1. Unset `REDIS_URL` or stop Redis in production.
2. The limiter logs a warning and transparently falls back to memory.
3. Across multiple API instances, the attacker can distribute requests and avoid a shared bucket.

**Remediation**

- Fail closed for auth-sensitive endpoints if Redis is required in production.
- Surface the degradation as a health-check or startup failure.
- Alert when the limiter is not using the shared store.

**Code example**

```ts
const client = await getRedisClient();

if (!client) {
  if (env.isProduction) {
    throw new HttpError(503, 'Rate limiting unavailable', undefined, 'RATE_LIMIT_BACKEND_DOWN');
  }

  return consumeFromMemoryStore({ name, key, windowMs, maxRequests });
}
```

---

### 4) Internal metrics are publicly readable when `METRICS_TOKEN` is not configured

- **Severity:** Medium
- **CVSS:** 6.5
- **CWE:** CWE-306 (Missing Authentication for Critical Function)
- **Locations:**
  - `C:\Users\TK\Desktop\DoAn3\backend\src\app.ts:130-139`
  - `C:\Users\TK\Desktop\DoAn3\backend\src\config\env.ts:157-159`
  - `C:\Users\TK\Desktop\DoAn3\backend\.env.example:24-25`

**Why this matters**

`/api/metrics` exposes live route names, request counts, error counts, and timing data. The endpoint is only protected when `METRICS_TOKEN` is configured, so a production deployment that forgets to set the variable exposes internal operational data to anyone who can reach the API.

**Attack scenario / PoC**

```bash
curl https://api.example.com/api/metrics
```

If `METRICS_TOKEN` is unset, the request returns the metrics snapshot without authentication.

**Remediation**

- Require a metrics token in production.
- Fail startup or return a hard error if the token is missing.
- Prefer an internal network or admin-auth protected endpoint for diagnostics.

**Code example**

```ts
if (env.isProduction && !env.metricsToken) {
  throw new Error('METRICS_TOKEN is required in production');
}

app.get('/api/metrics', (req, res, next) => {
  if (!env.metricsToken || req.get('x-metrics-token') !== env.metricsToken) {
    return next(new HttpError(403, 'Forbidden', undefined, 'METRICS_FORBIDDEN'));
  }

  return res.json({ status: 'ok', metrics: getMetricsSnapshot() });
});
```

---

### 5) Baseline security headers are missing from the Express app

- **Severity:** Medium
- **CVSS:** 5.3
- **CWE:** CWE-693 (Protection Mechanism Failure)
- **Location:** `C:\Users\TK\Desktop\DoAn3\backend\src\app.ts:63-69`

**Why this matters**

The app disables `x-powered-by`, but it does not install `helmet` or any equivalent hardening middleware. As a result, responses do not get a baseline set of protections such as `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` / frame protection, or HSTS on HTTPS deployments. That is especially relevant because the app also serves public assets from `/uploads`.

**Attack scenario / PoC**

Inspect a normal API response header set and you will not see the standard hardening headers. That increases the blast radius of MIME sniffing, clickjacking, and cross-site information leakage.

**Remediation**

- Add `helmet` near the top of the middleware stack.
- Tune `crossOriginResourcePolicy` so public uploads still load from the frontend if needed.
- Add HSTS only when HTTPS termination is guaranteed.

**Code example**

```ts
import helmet from 'helmet';

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: false, // keep /uploads embeddable if frontend is on a different origin
}));
```

---

## Notes on input validation

I did not find a direct path traversal primitive in the audited code paths:

- upload filenames are generated server-side
- the validation middleware parses body/query/params with Zod
- redirect targets are normalized to same-origin relative paths

The main input-handling issue that is security-relevant is the untrusted IP/header usage in rate limiting.

## Notes on dependency security

- Backend and frontend `npm audit --omit=dev` runs were clean at the time of review.
- No known moderate/high/critical dependency vulnerabilities were reported.

## Recommended next steps

1. Fix the debug-token exposure path first.
2. Remove the untrusted IP source from rate limiting.
3. Make Redis-backed throttling fail closed in production.
4. Lock down `/api/metrics`.
5. Add baseline security headers and then validate the uploads flow still works cross-origin.
