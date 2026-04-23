/**
 * @file authApi.ts - API client chính cho xác thực và gọi API backend.
 *
 * File này chịu trách nhiệm:
 * - Quản lý access token trong memory (không lưu localStorage để tăng bảo mật).
 * - Cung cấp hàm apiRequest: gọi API kèm token, tự động retry bằng refresh nếu 401.
 * - Cung cấp hàm apiUploadRequest: gọi API upload file (FormData).
 * - authApi object: tập hợp các endpoint auth (login, register, refresh, logout, me, ...).
 * - Cơ chế dedup refresh: đảm bảo chỉ có 1 request refresh chạy tại một thời điểm.
 * - Session expired handler: thông báo cho AuthContext khi phiên thật sự hết hạn.
 *
 * Luồng xử lý lỗi 401:
 * 1. Gọi API → nhận 401.
 * 2. Thử refresh token (1 lần duy nhất).
 * 3. Nếu refresh thành công → retry request ban đầu với token mới.
 * 4. Nếu refresh thất bại → clear token + notify session expired + throw error.
 */

export type Role = 'STUDENT' | 'MENTOR' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type UserProfile = {
  avatarUrl: string | null;
  coverImageUrl: string | null;
  phoneNumber: string | null;
  location: string | null;
  birthYear: number | null;
  gender: Gender | null;
  province: string | null;
  schoolOrCompany: string | null;
  department: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  jobTitle: string | null;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  emailVerifiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  profile?: UserProfile | null;
  assessment?: {
    latestAttempt: {
      id: string;
      quizType: string;
      quizVersion: string;
      status: string;
      resultCode: string;
      topTraits: string[];
      rawScores: Record<string, number>;
      answers: {
        holland: Array<{ questionId: string; group: string; value: number }>;
        situational: Array<{
          questionId: string;
          optionId: string;
          specialAction: string | null;
          bonus: Record<string, number>;
        }>;
      };
      summary: {
        title: string;
        headline: string;
        description: string;
        matchedCareers: string[];
        suggestedMajors: string[];
        suggestedMentorExpertise: string[];
        topTraits: string[];
        ranking?: Array<{
          resultCode: string;
          title: string;
          headline: string;
          matchPercent: number;
          affinityScore: number;
          confidence: 'high' | 'medium' | 'low';
          primaryTraits: string[];
          matchedCareers: string[];
          suggestedMajors: string[];
        }>;
        hollandBreakdown?: Array<{
          code: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
          score: number;
          percent: number;
          rank: number;
        }>;
        scoringMeta?: {
          dominantCode: string;
          spreadFromTop1ToTop3: number;
          fallbackTriggered: boolean;
          specialActions: string[];
        };
      };
      startedAt: string | null;
      submittedAt: string;
      createdAt: string;
      updatedAt: string;
    } | null;
  };
};

import {
  AppError,
  AUTH_SESSION_EXPIRED_CODE,
  AUTH_SESSION_EXPIRED_MESSAGE,
  createAppError,
  toSessionExpiredError,
} from './appError';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export const toApiAssetUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

type RefreshResponse = {
  user: AuthUser | null;
  accessToken: string | null;
};

type ApiRequestConfig = {
  retryOnAuthFailure?: boolean;
  isFormData?: boolean;
  fallbackMessage?: string;
};

type SessionExpiredHandler = (error: AppError) => void;

// Access token chỉ sống trong memory; browser chỉ tự mang refresh cookie qua credentials: include.
let currentAccessToken: string | null = null;
let refreshRequest: Promise<RefreshResponse> | null = null;
let sessionExpiredHandler: SessionExpiredHandler | null = null;
let lastSessionExpiredNotificationAt = 0;

export const authTokenStore = {
  get: () => currentAccessToken,
  set: (token: string | null) => {
    currentAccessToken = token;
  },
};

export const setAuthSessionExpiredHandler = (handler: SessionExpiredHandler | null) => {
  sessionExpiredHandler = handler;
};

const buildHeaders = (
  originalHeaders: HeadersInit | undefined,
  accessToken: string | null,
  isFormData: boolean,
) => {
  const headers = new Headers(originalHeaders || {});

  if (isFormData) {
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    headers.delete('Authorization');
  }

  return headers;
};

const executeApiRequest = async (
  path: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {},
  accessToken = authTokenStore.get(),
) => {
  const headers = buildHeaders(options.headers, accessToken, Boolean(config.isFormData));

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  return {
    response,
    payload,
  };
};

const shouldRetryWithRefresh = (
  path: string,
  response: Response,
  config: ApiRequestConfig,
) => {
  if (config.retryOnAuthFailure === false) return false;
  if (response.status !== 401) return false;

  return !['/auth/login', '/auth/register', '/auth/refresh'].includes(path);
};

const notifySessionExpired = (error: AppError) => {
  const now = Date.now();
  if (now - lastSessionExpiredNotificationAt < 1000) return;

  lastSessionExpiredNotificationAt = now;
  sessionExpiredHandler?.(error);
};

const getSessionExpiredError = (error: unknown) => {
  if (error instanceof AppError && error.code === AUTH_SESSION_EXPIRED_CODE) {
    return error;
  }

  return toSessionExpiredError(error);
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {},
): Promise<T> => {
  const initialResult = await executeApiRequest(path, options, config);

  if (initialResult.response.ok) {
    return initialResult.payload as T;
  }

  // Mỗi request chỉ thử refresh một vòng để tránh lặp vô hạn khi phiên thật sự đã hết hạn.

  const fallbackMessage = config.fallbackMessage || 'Yêu cầu không thành công';
  const initialError = createAppError(initialResult.response, initialResult.payload, fallbackMessage);

  if (!shouldRetryWithRefresh(path, initialResult.response, config)) {
    throw initialError;
  }

  try {
    const refreshed = await authApi.refresh();

    if (!refreshed.accessToken || !refreshed.user) {
      throw new AppError(AUTH_SESSION_EXPIRED_MESSAGE, {
        status: 401,
        code: AUTH_SESSION_EXPIRED_CODE,
      });
    }

    authTokenStore.set(refreshed.accessToken);

    const retryResult = await executeApiRequest(path, options, config, refreshed.accessToken);
    if (!retryResult.response.ok) {
      throw createAppError(retryResult.response, retryResult.payload, fallbackMessage);
    }

    return retryResult.payload as T;
  } catch (error) {
    const sessionExpiredError = getSessionExpiredError(error);
    if (!sessionExpiredError) {
      throw error;
    }

    authTokenStore.set(null);
    notifySessionExpired(sessionExpiredError);
    throw sessionExpiredError;
  }
};

export const apiUploadRequest = async <T>(
  path: string,
  body: FormData,
  options: Omit<RequestInit, 'body'> = {},
  config: Omit<ApiRequestConfig, 'isFormData'> = {},
) => apiRequest<T>(path, {
  ...options,
  body,
}, {
  ...config,
  isFormData: true,
});

export const authApi = {
  register: (input: { fullName: string; email: string; password: string; role: 'STUDENT' | 'MENTOR' }) =>
    apiRequest<{ user: AuthUser; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }, {
      retryOnAuthFailure: false,
    }),

  login: (input: { email: string; password: string }) =>
    apiRequest<{ user: AuthUser; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }, {
      retryOnAuthFailure: false,
    }),

  refresh: () => {
    if (refreshRequest) {
      return refreshRequest;
    }

    // Đồng bộ refresh để tránh race condition khi refresh token bị rotate.
    refreshRequest = apiRequest<RefreshResponse>('/auth/refresh', {
      method: 'POST',
    }, {
      retryOnAuthFailure: false,
    }).finally(() => {
      refreshRequest = null;
    });

    return refreshRequest;
  },

  logout: () =>
    apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    }, {
      retryOnAuthFailure: false,
    }),

  me: () =>
    apiRequest<{ user: AuthUser }>('/auth/me', {
      method: 'GET',
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string; token?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, {
      retryOnAuthFailure: false,
    }),

  resetPassword: (input: { token: string; newPassword: string }) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    }, {
      retryOnAuthFailure: false,
    }),
};
