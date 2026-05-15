# ITCompass Code Quality Review

## Executive summary

The codebase is broadly functional, but several maintainability issues will get expensive to change as the project grows. The biggest concerns are background jobs that can execute multiple times in multi-instance deployments, silent degradation in auth/bootstrap flows, and a few very large frontend modules that mix too many responsibilities.

## Findings

### 1) High — Scheduled jobs are not safe in multi-instance deployments

- **File:** `backend/src/tasks/scheduler.ts:70-75`
- **Issue:** Every server instance starts the same interval jobs immediately on boot. There is no distributed lock, leader election, or queue-based coordination. In a scaled deployment, the same job can run multiple times, causing duplicate reminder emails, duplicate blog publishing, or repeated no-show updates.
- **Why it matters:** This is a structural maintainability/operations problem, not just a performance detail. The behavior is correct only for a single-process deployment.
- **Recommendation:** Move recurring work to a single scheduler worker or guard execution with a distributed lock (Redis/DB). At minimum, centralize the scheduler behind a leader election check.

```ts
// Example: take a distributed lock before running a job
const runJob = async (job: ScheduledJob) => {
  const lock = await acquireLock(`scheduler:${job.name}`, 55_000);
  if (!lock) return;

  try {
    await job.task();
  } finally {
    await lock.release();
  }
};
```

---

### 2) Medium — Build artifacts are tracked instead of ignored in the backend

- **File:** `backend/.gitignore:1-11`
- **Issue:** The backend ignore file does not exclude `dist/`, so compiled output is tracked in the repository. The current working tree already shows many `backend/dist/**/*.js` modifications, which means source and build output can drift apart.
- **Why it matters:** This creates noisy diffs, increases review burden, and makes it easier for stale compiled code to be deployed by mistake.
- **Recommendation:** Ignore build output in the backend the same way the frontend does, then remove tracked artifacts from version control once.

```gitignore
node_modules
coverage
dist
*.tsbuildinfo
.env
.env.*
!.env.example
```

---

### 3) Medium — Redis rate limiting silently falls back to per-process memory

- **File:** `backend/src/middlewares/rate-limit.middleware.ts:137-177`
- **Issue:** If Redis is unavailable, the middleware quietly falls back to an in-memory store. That means rate limits become inconsistent across instances and are reset on restart, but the application still behaves as if everything is fine.
- **Why it matters:** This is a hidden operational downgrade that is hard to notice during development and can become a production maintenance issue later.
- **Recommendation:** Either fail fast when Redis-backed rate limiting is expected, or explicitly expose degraded mode through metrics/health checks so operators know protections are weaker.

```ts
const rateLimitState = await consumeFromRedisStore(...);
if (!rateLimitState) {
  logger.warn('Rate limiting degraded to memory store', { name });
  // Option A: return next(new HttpError(...))
  // Option B: continue, but surface a degraded-mode metric
}
```

---

### 4) Medium — Auth response creation mixes concerns and performs extra DB reads

- **File:** `backend/src/services/auth.service.ts:52-91, 105-137, 156-181`
- **Issue:** `createAuthResponse` generates tokens, creates the session, and then re-queries the user from the database just to serialize the response. This couples token issuance, persistence, and serialization into one helper and adds an extra round trip on every auth flow.
- **Why it matters:** The current structure is harder to reuse and will become costly to extend when new auth flows need different user shapes.
- **Recommendation:** Separate token/session creation from user serialization. Pass a fully loaded user into the response builder when possible.

```ts
const buildAuthResponse = async ({ user, userId, userAgent, ipAddress }: {
  user: UserWithProfile;
  userId: bigint;
  userAgent: string | null;
  ipAddress: string | null;
}) => {
  const accessToken = generateAccessToken(user);
  const { refreshToken, expiresAt } = await createSession({ userId, userAgent, ipAddress });

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt: expiresAt,
    user: serializeUser(user),
  };
};
```

---

### 5) Medium — Auth bootstrap treats any refresh failure as “logged out”

- **File:** `frontend/src/contexts/AuthContext.tsx:64-87, 139-145`
- **Issue:** The initial bootstrap and `refreshUser` both swallow all errors. If the backend is temporarily unavailable or returns a non-auth error, the code clears the token and resets the user state as if the session truly expired.
- **Why it matters:** Users can be logged out because of transient infrastructure problems, and the real root cause is hidden.
- **Recommendation:** Distinguish expected auth-expired responses from network/server failures. Only clear session state for the former.

```ts
try {
  const result = await authApi.refresh();
  if (result.accessToken && result.user) {
    authTokenStore.set(result.accessToken);
    setUser(result.user);
  }
} catch (error) {
  if (isSessionExpiredError(error)) {
    authTokenStore.set(null);
    setUser(null);
    return;
  }
  logError(error, { scope: 'AuthContext.bootstrap' });
  setState((s) => ({ ...s, isLoading: false, isInitialized: true }));
}
```

---

### 6) Medium — API client assumes every response is JSON and hides parse errors

- **File:** `frontend/src/lib/authApi.ts:183-203`
- **Issue:** `executeApiRequest` always calls `response.json().catch(() => ({}))`. That masks parse failures, makes 204/text responses look like empty JSON, and reduces debuggability when the backend returns a non-JSON error.
- **Why it matters:** Error handling becomes vague, especially during debugging or when new endpoints intentionally return no body.
- **Recommendation:** Parse conditionally based on status/content-type and preserve parse failures when the response is expected to be JSON.

```ts
const contentType = response.headers.get('content-type') ?? '';
const payload = contentType.includes('application/json')
  ? await response.json()
  : null;
```

---

### 7) Medium — Landing page is a monolithic component with weak cohesion

- **File:** `frontend/src/pages/LandingPage.tsx:82-814`
- **Issue:** The landing page contains seven large sections, local hooks, motion helpers, query logic, and copy all in one file. The component is difficult to scan and any change risks unrelated sections.
- **Why it matters:** This increases merge conflicts, makes testing harder, and raises the cost of incremental UI changes.
- **Recommendation:** Split the page into section components and move static content arrays into separate modules.

```tsx
// pages/LandingPage.tsx
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CareerPathsSection />
      <HowItWorksSection />
      <FeaturedBlogSection />
      <FeaturedMentorsSection />
      <FinalCTASection />
    </>
  );
}
```

---

### 8) Medium — Profile page combines too many responsibilities in one file

- **File:** `frontend/src/pages/ProfilePage.tsx:115-649`
- **Issue:** The profile page handles form state, validation, uploads, multiple queries, optimistic UI updates, and a large render tree in a single component.
- **Why it matters:** This makes the page expensive to modify and easy to break when adding new profile fields or data sections.
- **Recommendation:** Extract a `useProfileForm` hook, separate upload handlers, and split the view into smaller presentational components.

```tsx
const { form, setField, saveProfile, uploadAvatar, uploadCover } = useProfileForm(user);

return (
  <ProfileHeader ... />
  <ProfileForm ... />
  <AssessmentPanel ... />
  <MentorRecommendations ... />
);
```

---

### 9) Low — Error translation tables are duplicated and drift-prone

- **File:** `frontend/src/lib/appError.ts:24-119, 81-119`
- **Issue:** Error handling relies on two separate translation maps: one keyed by backend codes and one keyed by raw messages. Several auth-related entries are duplicated across both tables, so adding a new backend error requires editing multiple places.
- **Why it matters:** This is manageable now, but the mapping will become a maintenance hotspot as new modules add more error codes.
- **Recommendation:** Keep a single canonical error-code map and derive text fallbacks from it where possible.

```ts
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  // ...
};

const translateError = (code?: string, message?: string) =>
  (code && ERROR_MESSAGES[code]) || message || 'Yêu cầu không thành công';
```

---

## Most important findings

1. The scheduler is unsafe for multi-instance deployment and can execute jobs more than once.
2. The backend is tracking compiled `dist/` output, which increases drift and review noise.
3. Auth bootstrap and API parsing both swallow failures too aggressively, making outages look like logout events.
4. The landing page and profile page are both too large and should be split into smaller, cohesive modules.

