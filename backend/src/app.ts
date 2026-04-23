/**
 * @file app.ts - Cấu hình và khởi tạo ứng dụng Express chính.
 *
 * File này chịu trách nhiệm:
 * - Cấu hình CORS (Cross-Origin Resource Sharing) để kiểm soát domain được phép gọi API.
 * - Đăng ký các middleware toàn cục: cookie parser, JSON body parser, request context, metrics.
 * - Mount toàn bộ route theo nhóm: auth, user, assessment, blog, mentor, admin.
 * - Cung cấp các endpoint health check cho monitoring (live, ready, metrics).
 * - Xử lý lỗi tập trung: route không tồn tại (404), lỗi JSON, lỗi upload, lỗi HTTP tùy chỉnh,
 *   và lỗi không xác định (500).
 */

import cors, { type CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { adminAssessmentRoutes, assessmentRoutes } from './routes/assessment.routes.js';
import { adminBlogRoutes, blogRoutes } from './routes/blog.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminUserRoutes from './routes/admin-user.routes.js';
import { mentorRoutes, publicMentorRoutes } from './routes/mentor.routes.js';
import adminMentorRoutes from './routes/admin-mentor.routes.js';
import { authConfig } from './config/auth.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { getMetricsSnapshot, metricsMiddleware } from './middlewares/metrics.middleware.js';
import { requestContext } from './middlewares/request-context.middleware.js';
import { HttpError, isHttpError } from './utils/httpError.js';
import { logger } from './utils/logger.js';

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra origin có nằm trong danh sách cho phép không.
 * Hỗ trợ cả danh sách tĩnh (allowedOrigins) và pattern dev local (localhost:*).
 */
const isAllowedOrigin = (origin: string) =>
  authConfig.allowedOrigins.includes(origin) ||
  authConfig.localDevOriginPatterns.some((pattern) => pattern.test(origin));

/** Cấu hình CORS: chỉ cho phép origin đã đăng ký, bật credentials cho cookie auth. */
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin ${origin} is not allowed`));
  },
  credentials: true,
};

// ── Middleware toàn cục ──────────────────────────────────────────────────────

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: env.requestBodyLimit }));
app.use(requestContext);   // Gán requestId + requestStartedAt cho mỗi request
app.use(metricsMiddleware); // Thu thập metrics thời gian xử lý và số lượt request

// ── Đăng ký route ────────────────────────────────────────────────────────────

// Auth và phiên làm việc được mount riêng để gom toàn bộ cookie/refresh flow về một chỗ.
app.use('/api/auth', authRoutes);

// Nhóm API người dùng cuối giữ prefix theo domain để từng module tự chốt middleware và validator phù hợp.
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/mentors', publicMentorRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/blogs', blogRoutes);

// Toàn bộ route quản trị cùng đi qua /api/admin để RBAC, audit và điều tra sự cố tập trung hơn.
app.use('/api/admin', adminBlogRoutes);
app.use('/api/admin', adminAssessmentRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminMentorRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', express.static('uploads'));

// ── Health check endpoints ───────────────────────────────────────────────────

/** Health check cơ bản: xác nhận server đang chạy. */
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Backend is running',
    status: 'ok',
    environment: env.nodeEnv,
  });
});

/** Liveness probe: xác nhận process còn sống (dùng cho Kubernetes/Docker). */
app.get('/api/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    environment: env.nodeEnv,
  });
});

/** Readiness probe: kiểm tra kết nối database sẵn sàng phục vụ request. */
app.get('/api/health/ready', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      environment: env.nodeEnv,
    });
  } catch {
    return next(new HttpError(503, 'Database is not ready', undefined, 'DB_NOT_READY'));
  }
});

/** Endpoint lấy snapshot metrics (số request, thời gian xử lý), bảo vệ bằng token. */
app.get('/api/metrics', (req: Request, res: Response, next: NextFunction) => {
  if (env.metricsToken && req.get('x-metrics-token') !== env.metricsToken) {
    return next(new HttpError(403, 'Forbidden', undefined, 'METRICS_FORBIDDEN'));
  }

  return res.status(200).json({
    status: 'ok',
    metrics: getMetricsSnapshot(),
  });
});

// ── Error handling ───────────────────────────────────────────────────────────

/** Middleware xử lý route không tồn tại (404). */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    requestId: req.requestId,
  });
});

/**
 * Middleware xử lý lỗi tập trung (global error handler).
 * Phân loại và trả response phù hợp cho từng loại lỗi:
 * - SyntaxError: JSON body không hợp lệ.
 * - MulterError: Lỗi upload file (quá kích thước, ...).
 * - HttpError: Lỗi nghiệp vụ tùy chỉnh với status code cụ thể.
 * - Lỗi không xác định: trả 500 Internal Server Error.
 */
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  void _next;

  if (error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Malformed JSON request body',
      code: 'REQUEST_INVALID_JSON',
      requestId: req.requestId,
    });
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: `Image must not exceed ${env.uploadMaxFileSizeMb}MB`,
        code: 'UPLOAD_FILE_TOO_LARGE',
        requestId: req.requestId,
      });
    }

    return res.status(400).json({
      message: error.message,
      code: 'UPLOAD_FAILED',
      requestId: req.requestId,
    });
  }

  if (isHttpError(error)) {
    if (error.statusCode >= 500) {
      logger.error('Handled HTTP error', {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: error.statusCode,
        error,
      });
    }

    return res.status(error.statusCode).json(error.toResponseBody(req.requestId));
  }

  logger.error('Unhandled application error', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    error,
  });

  return res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    requestId: req.requestId,
  });
});

export default app;
