# Phase 2B: Performance & Scalability Analysis

## Executive Summary

The codebase already has some good foundations for scale, such as route-level code splitting in the frontend and several targeted database indexes. The biggest risks are on the backend: a few request paths still do full-table scans or load all rows into memory, and the in-process scheduler will duplicate work in horizontally scaled deployments.

Overall, the most important fixes are to add the right composite/search indexes, stop scanning the mentor table in memory, guard background jobs with a distributed lock, and remove the unbounded in-memory fallback in rate limiting.

## Findings

### 1) Blog feed and admin post listing are not indexed for the actual query shapes

- **Severity:** High
- **Estimated impact:** As the blog table grows, both public listing and admin listing will increasingly rely on filesorts and table scans. On a medium-sized catalog, this typically turns a fast page into a noticeable 100-300ms+ query; at larger scale it can become multi-second under load.
- **Location:** `backend/src/services/blog-post.service.ts:145-180`, `backend/src/services/blog-post.service.ts:188-224`, `backend/prisma/schema.prisma:182-216`
- **Why this is a problem:**
  - Public listing filters by `status`, `deletedAt`, and `publishedAt <= now`, then orders by `publishedAt desc, createdAt desc`.
  - Admin listing adds `updatedAt` sort and optional search across `title`, `excerpt`, and `content` using `contains`.
  - The schema only has `@@index([status, publishedAt])` and `@@index([deletedAt])`, which is not enough for the real access pattern.
  - The `contains` search on `content` is especially expensive because it cannot use a normal B-tree index.
- **Recommendation:**
  - Add a composite index that matches the feed query.
  - Move text search to a full-text strategy or a dedicated search field/table.
  - For admin lists, prefer cursor pagination or cached totals if the table grows large.

**Example optimization**

```prisma
model BlogPost {
  // ...existing fields...
  @@index([status, deletedAt, publishedAt, createdAt], map: "idx_bv_feed")
  @@index([status, updatedAt], map: "idx_bv_admin_list")
}
```

```ts
// MySQL full-text search for admin post search
const posts = await prisma.$queryRaw<Array<{ id: bigint; title: string; slug: string }>>`
  SELECT id, tieu_de AS title, slug
  FROM bai_viet_blog
  WHERE trang_thai = 'PUBLISHED'
    AND xoa_luc IS NULL
    AND xuat_ban_luc <= NOW()
    AND MATCH(tieu_de, tom_tat, noi_dung) AGAINST (${search} IN BOOLEAN MODE)
  ORDER BY xuat_ban_luc DESC, tao_luc DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

---

### 2) Mentor recommendations scan the full mentor table in application memory

- **Severity:** High
- **Estimated impact:** The cost grows linearly with the number of mentors. At a few hundred rows the impact is minor; at thousands of mentors, profile-page recommendation can become one of the slowest endpoints in the app because it fetches every active mentor, filters in JS, then slices the result.
- **Location:** `backend/src/services/mentor.service.ts:220-277`, `backend/src/services/mentor.service.ts:295-332`, `backend/prisma/schema.prisma:271-300`
- **Why this is a problem:**
  - `listMentors` uses `contains` search across several text fields without supporting indexes.
  - `getRecommendedMentors` does `prisma.mentor.findMany(...)` for all active mentors, then filters in memory with `hasMatchedExpertise(...)`.
  - The recommendation path is hit from `ProfilePage`, so the slow path is user-visible.
- **Recommendation:**
  - Push matching into the database by storing normalized expertise tags in a relation or separate indexed table.
  - Cache recommendation results per user assessment result and invalidate when the assessment changes or a mentor profile changes.
  - If the app stays single-instance, an in-memory cache is acceptable; for horizontal scale, use Redis.

**Example optimization**

```ts
const cacheKey = `mentor-reco:${userId}:${summary?.resultCode ?? 'none'}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const mentors = await prisma.mentor.findMany({
  where: {
    status: 'ACTIVE',
    // Prefer indexed tags/relations instead of in-memory filtering.
  },
  orderBy: [{ isVerified: 'desc' }, { reviewCount: 'desc' }, { yearsOfExperience: 'desc' }, { id: 'desc' }],
  take: normalizedLimit,
});

await redis.setEx(cacheKey, 300, JSON.stringify({ source: 'assessment', matchedExpertise, mentors }));
```

---

### 3) Assessment dashboard statistics perform a full-table aggregation each time

- **Severity:** Medium
- **Estimated impact:** Admin analytics will get slower as `AssessmentAttempt` grows. The current query pattern scans and groups the entire table to derive current stats, which can easily become a multi-second query on a large dataset.
- **Location:** `backend/src/services/assessment.service.ts:181-219`, `backend/prisma/schema.prisma:474-495`
- **Why this is a problem:**
  - `getAdminAssessmentStats` runs a `COUNT(*)`, a grouped subquery for latest attempt per user, and a distinct-user count every time the endpoint is hit.
  - The existing indexes help some user-scoped lookups, but they do not remove the need to aggregate the whole table for dashboard stats.
- **Recommendation:**
  - Move this to a precomputed summary table or cached metric payload that is refreshed on schedule or on attempt submission.
  - If real-time accuracy is not required, cache the admin stats for a short TTL.

**Example optimization**

```ts
// Cached / materialized admin stats
const cacheKey = 'assessment:admin-stats';
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const stats = await prisma.assessmentAttemptSummary.findMany();
await redis.setEx(cacheKey, 300, JSON.stringify(stats));
return stats;
```

---

### 4) Auth/session bootstrap does extra DB round-trips and eagerly loads more data than needed

- **Severity:** Medium
- **Estimated impact:** Every login/register/refresh path performs an extra user lookup, and the `me` endpoint loads both profile and assessment summary. This adds latency to session bootstrap and profile refresh, especially when these calls happen back-to-back.
- **Location:** `backend/src/services/auth.service.ts:52-91`, `backend/src/services/auth.service.ts:197-217`
- **Why this is a problem:**
  - `createAuthResponse` creates the session and then re-fetches the user from the database even when the caller already has a user object available.
  - `me` eagerly fetches the latest assessment summary even for callers that only need authentication state.
  - This is not catastrophic, but it is unnecessary I/O on hot paths.
- **Recommendation:**
  - Return a minimal auth payload from refresh/login and fetch the full profile only when the UI needs it.
  - Avoid re-querying the same user inside `createAuthResponse` when the caller already owns the needed fields.
  - Cache the assessment summary separately because it changes much less frequently than the auth session.

**Example optimization**

```ts
const createAuthResponse = async ({
  user,
  userId,
  userAgent,
  ipAddress,
}: {
  user: { id: bigint; fullName: string; email: string; role: string; status: string; emailVerifiedAt: Date | null };
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
    user,
  };
};
```

---

### 5) The in-memory rate-limit fallback can grow without bound and is not horizontally safe

- **Severity:** Medium
- **Estimated impact:** If Redis is unavailable, every unique rate-limit key creates a permanent in-memory bucket until the process restarts. Under attack traffic or high-cardinality identities, memory usage grows continuously. Protection also becomes node-local, so different instances will enforce different limits.
- **Location:** `backend/src/middlewares/rate-limit.middleware.ts:31-47`, `backend/src/middlewares/rate-limit.middleware.ts:73-124`, `backend/src/middlewares/rate-limit.middleware.ts:163-190`
- **Why this is a problem:**
  - `stores` is a nested `Map` with no TTL cleanup.
  - The fallback is meant to preserve functionality, but it becomes a memory leak under long-lived traffic.
  - In a scaled deployment, the fallback breaks consistency because each node keeps its own counters.
- **Recommendation:**
  - Require Redis for production rate limiting and keep the memory fallback only for local development.
  - If the fallback must remain, add TTL eviction or use an LRU cache with a hard size cap.

**Example optimization**

```ts
const cleanupExpiredBuckets = () => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, bucket] of store.entries()) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }
};

setInterval(cleanupExpiredBuckets, 60_000).unref();
```

---

### 6) Background jobs duplicate work per instance, and bulk admin actions fan out unbounded parallel DB calls

- **Severity:** High
- **Estimated impact:** In a multi-instance deployment, every API process runs the same scheduler, so scheduled tasks are multiplied by the instance count. The bulk post action helper can also create a burst of parallel DB calls large enough to saturate the connection pool.
- **Location:** `backend/src/tasks/scheduler.ts:31-75`, `backend/src/tasks/scheduled.tasks.ts:103-138`, `backend/src/services/blog-post.service.ts:570-588`
- **Why this is a problem:**
  - The scheduler starts intervals inside the API process, so scaling from 1 instance to 3 instances can turn one scheduled job into three concurrent executions.
  - `runBulkPostAction` uses `Promise.all(ids.map(...))` with no concurrency cap.
  - Both patterns can create duplicate writes, duplicate notifications, or connection spikes.
- **Recommendation:**
  - Run cron jobs in a single worker or guard them with a distributed lock.
  - Limit concurrency for bulk actions, or better, rewrite them as set-based updates when possible.

**Example optimization**

```ts
import pLimit from 'p-limit';

const limit = pLimit(5);
const results = await Promise.all(
  ids.map((id) => limit(async () => action(id))),
);
```

```ts
// Distributed lock around a scheduled job
const lockKey = 'locks:scheduler:publish-scheduled-posts';
const locked = await redis.set(lockKey, instanceId, { NX: true, PX: 55_000 });
if (!locked) return;
try {
  await publishScheduledPosts();
} finally {
  await redis.del(lockKey);
}
```

---

### 7) Mark-all-notifications-as-read loads the full unread set into memory and emits one event per row

- **Severity:** Medium
- **Estimated impact:** Users with large unread inboxes pay for two full reads plus one update and then one socket emit per notification. That becomes visibly slower and increases memory pressure for large notification backlogs.
- **Location:** `backend/src/services/notification.service.ts:425-467`
- **Why this is a problem:**
  - The method fetches every unread notification, stores them in memory, performs `updateMany`, fetches them again, and then iterates to emit each update.
  - This is fine for tiny inboxes, but it scales poorly when unread counts grow.
- **Recommendation:**
  - Update unread notifications in a single query and emit one compact bulk event that tells the client to refetch or invalidate the notification list.
  - Only fetch row details if the UI absolutely needs them immediately.

**Example optimization**

```ts
const now = new Date();
const result = await prisma.notification.updateMany({
  where: { userId, readAt: null },
  data: { readAt: now },
});

emitNotificationBulkUpdated({ userId: String(userId), updatedCount: result.count });
return { updatedCount: result.count };
```

---

### 8) Frontend realtime listeners and chat rendering create avoidable always-on work

- **Severity:** Low
- **Estimated impact:** Every authenticated session keeps the socket connected and listens for broad invalidation events. In chat views, rendering the full message array without virtualization can cause avoidable paint and reconciliation work for long threads.
- **Location:** `frontend/src/main.tsx:55-67`, `frontend/src/components/shared/RealtimeBookingListener.tsx:13-33`, `frontend/src/components/shared/RealtimeNotificationListener.tsx:14-39`, `frontend/src/components/chat/ChatThread.tsx:191-201`
- **Why this is a problem:**
  - The socket connection is opened globally for every authenticated user.
  - Booking and notification events invalidate broad query roots, which can trigger more rerenders than necessary.
  - `ChatThread` renders the full message list directly; if conversation history grows, the component does more DOM work than needed.
- **Recommendation:**
  - Mount realtime listeners only on routes that need them, or narrow invalidation to the active page/conversation.
  - Use virtualization for long message lists and memoize message bubbles.

**Example optimization**

```tsx
import { FixedSizeList } from 'react-window';

const MessageList = ({ messages }: { messages: ConversationMessage[] }) => (
  <FixedSizeList height={560} itemCount={messages.length} itemSize={88} width="100%">
    {({ index, style }) => (
      <div style={style}>
        <MessageBubble message={messages[index]} currentUser={currentUser} />
      </div>
    )}
  </FixedSizeList>
);
```

## Overall Priority

1. Fix the blog, mentor, and assessment database hot paths first.
2. Move background jobs out of the API process or protect them with a distributed lock.
3. Remove the unbounded rate-limit fallback and the large notification bulk-read materialization.
4. Tighten the frontend realtime and chat rendering paths after the backend bottlenecks are addressed.
