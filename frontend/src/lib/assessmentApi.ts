/**
 * @file assessmentApi.ts - API client cho module đánh giá nghề nghiệp (career quiz).
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa types cho quiz template, attempt, scoring, và admin stats.
 * - Cung cấp assessmentApi object với các endpoint:
 *   + getCurrentTemplate: lấy bộ câu hỏi quiz hiện tại.
 *   + submitAttempt: gửi câu trả lời và nhận kết quả chấm điểm.
 *   + getLatestAttempt: lấy kết quả đánh giá mới nhất.
 *   + getHistory: lịch sử các lần đánh giá (phân trang).
 *   + getAdminStats: thống kê đánh giá cho admin dashboard.
 */

import { apiRequest } from './authApi';

export type AssessmentResultCode =
  | 'SE'
  | 'Data'
  | 'Cybersecurity'
  | 'UXUI'
  | 'QLDA'
  | 'DevOps'
  | 'Fallback';

export type AssessmentRankingItem = {
  resultCode: AssessmentResultCode;
  title: string;
  headline: string;
  matchPercent: number;
  affinityScore: number;
  confidence: 'high' | 'medium' | 'low';
  primaryTraits: string[];
  matchedCareers: string[];
  suggestedMajors: string[];
};

export type HollandBreakdownItem = {
  code: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
  score: number;
  percent: number;
  rank: number;
};

export type AssessmentSummary = {
  title: string;
  headline: string;
  description: string;
  matchedCareers: string[];
  suggestedMajors: string[];
  suggestedMentorExpertise: string[];
  topTraits: string[];
  ranking?: AssessmentRankingItem[];
  hollandBreakdown?: HollandBreakdownItem[];
  scoringMeta?: {
    dominantCode: string;
    spreadFromTop1ToTop3: number;
    fallbackTriggered: boolean;
    specialActions: string[];
  };
};

export type AssessmentAttempt = {
  id: string;
  quizType: string;
  quizVersion: string;
  status: string;
  resultCode: AssessmentResultCode;
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
  summary: AssessmentSummary;
  startedAt: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AssessmentTemplate = {
  quizType: string;
  version: string;
  estimatedMinutes: number;
  questionCount: number;
  hollandQuestions: Array<{ id: string; text: string; group: string }>;
  situationalQuestions: Array<{
    id: string;
    context: string;
    text: string;
    options: Array<{
      id: string;
      text: string;
      bonus: Record<string, number>;
      specialAction?: string;
    }>;
  }>;
  resultProfiles: Array<{
    resultCode: AssessmentResultCode;
    title: string;
    headline: string;
    description: string;
    matchedCareers: string[];
    majorSlugs: string[];
    mentorExpertise: string[];
  }>;
};

export type AdminAssessmentStats = {
  totalAttempts: number;
  completedUsers: number;
  completionRate: number;
  resultDistribution: Array<{
    resultCode: AssessmentResultCode;
    total: number;
  }>;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> =>
  apiRequest<T>(path, options, {
    fallbackMessage: 'Yêu cầu không thành công',
  });

export const assessmentApi = {
  // Assessment API giữ contract raw answers/attempt history tách riêng để QuizPage chỉ lo UX còn backend chốt kết quả chính thức.
  getCurrentTemplate: () => request<{ template: AssessmentTemplate }>('/assessments/templates/current'),
  submitAttempt: (input: {
    startedAt?: string;
    hollandAnswers: Record<string, number>;
    situationalAnswers: Record<string, string>;
  }) =>
    request<{ attempt: AssessmentAttempt }>('/assessments/attempts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getLatestAttempt: () => request<{ attempt: AssessmentAttempt | null }>('/assessments/me/latest'),
  getHistory: (page = 1, limit = 10) =>
    request<{ attempts: AssessmentAttempt[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/assessments/me/history?page=${page}&limit=${limit}`,
    ),
  getAdminStats: () => request<{ stats: AdminAssessmentStats }>('/admin/assessments/stats'),
};
