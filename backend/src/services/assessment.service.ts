import type { AssessmentAttempt, Prisma } from '@prisma/client';

import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { toBigIntId } from '../utils/ids.js';
import type {
  HollandScores,
  NormalizedAssessmentAttempt,
  SerializedHollandAnswer,
  SerializedSituationalAnswer,
} from '../types/assessment.js';
import { assessmentCatalog } from './assessment.catalog.js';
import { HOLLAND_GROUPS } from './assessment.constants.js';
import { buildAssessmentSummary, scoreAssessment } from './assessment.scoring.js';

const normalizeAttempt = (attempt: AssessmentAttempt | null): NormalizedAssessmentAttempt | null => {
  if (!attempt) return null;

  return {
    id: String(attempt.id),
    quizType: attempt.quizType,
    quizVersion: attempt.quizVersion,
    status: attempt.status,
    resultCode: attempt.resultCode,
    topTraits: attempt.topTraits,
    rawScores: attempt.rawScoresJson,
    answers: attempt.answersJson,
    summary: attempt.summaryJson,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };
};

export const getCurrentTemplate = async () => ({
  quizType: assessmentCatalog.quizType,
  version: assessmentCatalog.version,
  estimatedMinutes: assessmentCatalog.estimatedMinutes,
  questionCount:
    assessmentCatalog.hollandQuestions.length + assessmentCatalog.situationalQuestions.length,
  hollandQuestions: assessmentCatalog.hollandQuestions,
  situationalQuestions: assessmentCatalog.situationalQuestions,
  resultProfiles: assessmentCatalog.resultOrder.map((code) => ({
    resultCode: code,
    ...assessmentCatalog.resultProfiles[code],
  })),
});

export const submitAttempt = async ({
  userId,
  startedAt,
  hollandAnswers,
  situationalAnswers,
}: {
  userId: bigint;
  startedAt?: string;
  hollandAnswers: Record<string, number>;
  situationalAnswers: Record<string, string>;
}) => {
  const normalizedHolland = Object.fromEntries(HOLLAND_GROUPS.map((group) => [group, 0])) as HollandScores;

  // Chỉ chấm điểm khi toàn bộ câu hỏi bắt buộc đã có mặt để frontend/backend luôn ra cùng một kết quả.
  const serializedHollandAnswers: SerializedHollandAnswer[] = assessmentCatalog.hollandQuestions.map((question) => {
    const value = hollandAnswers[question.id];
    if (typeof value !== 'number') {
      throw new HttpError(400, `Missing answer for ${question.id}`);
    }

    normalizedHolland[question.group] += value;
    return {
      questionId: question.id,
      group: question.group,
      value,
    };
  });

  const serializedSituationalAnswers: SerializedSituationalAnswer[] = assessmentCatalog.situationalQuestions.map((question) => {
    const optionId = situationalAnswers[question.id];
    if (!optionId) {
      throw new HttpError(400, `Missing answer for ${question.id}`);
    }

    const selectedOption = question.options.find((option) => option.id === optionId);
    if (!selectedOption) {
      throw new HttpError(400, `Câu trả lời không hợp lệ cho ${question.id}`);
    }

    return {
      questionId: question.id,
      optionId: selectedOption.id,
      specialAction: selectedOption.specialAction || null,
      bonus: selectedOption.bonus,
    };
  });

  const analysis = scoreAssessment(normalizedHolland, serializedSituationalAnswers);
  const summary = buildAssessmentSummary(analysis);

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      userId,
      quizType: assessmentCatalog.quizType as AssessmentAttempt['quizType'],
      quizVersion: assessmentCatalog.version,
      resultCode: analysis.resultCode,
      topTraits: summary.topTraits as unknown as Prisma.InputJsonValue,
      rawScoresJson: analysis.totalScores as unknown as Prisma.InputJsonValue,
      answersJson: {
        holland: serializedHollandAnswers,
        situational: serializedSituationalAnswers,
      } as unknown as Prisma.InputJsonValue,
      summaryJson: summary as unknown as Prisma.InputJsonValue,
      startedAt: startedAt ? new Date(startedAt) : null,
    },
  });

  return normalizeAttempt(attempt);
};

export const getLatestAttempt = async ({ userId }: { userId: bigint }) => {
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { userId },
    // latestAttempt là contract chung cho profile/recommended-mentors nên luôn lấy bản nộp mới nhất theo submittedAt.
    orderBy: { submittedAt: 'desc' },
  });

  return normalizeAttempt(attempt);
};

export const getAttemptHistory = async ({
  userId,
  page,
  limit,
}: {
  userId: bigint;
  page: number;
  limit: number;
}) => {
  const normalizedUserId = toBigIntId(userId, 'userId');
  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);

  const [total, attempts] = await prisma.$transaction([
    prisma.assessmentAttempt.count({
      where: { userId: normalizedUserId },
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId: normalizedUserId },
      orderBy: { submittedAt: 'desc' },
      skip: (normalizedPage - 1) * normalizedLimit,
      take: normalizedLimit,
    }),
  ]);

  return {
    attempts: attempts.map(normalizeAttempt),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
    },
  };
};

export const getAttemptById = async ({ userId, attemptId }: { userId: bigint; attemptId: string }) => {
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: toBigIntId(attemptId, 'attemptId'),
      userId,
    },
  });

  if (!attempt) {
    throw new HttpError(404, 'Assessment attempt not found');
  }

  return normalizeAttempt(attempt);
};

export const getAdminAssessmentStats = async () => {
  const [totalAttempts, latestRows, distinctCompletedRows, totalUsers] = await Promise.all([
    prisma.assessmentAttempt.count(),
    prisma.$queryRaw<Array<{ resultCode: string; total: bigint | number }>>`
      SELECT latest.ma_ket_qua AS resultCode, COUNT(*) AS total
      FROM ket_qua_danh_gia latest
      INNER JOIN (
        SELECT nguoi_dung_id, MAX(nop_luc) AS latestSubmittedAt
        FROM ket_qua_danh_gia
        GROUP BY nguoi_dung_id
      ) grouped
        ON grouped.nguoi_dung_id = latest.nguoi_dung_id
       AND grouped.latestSubmittedAt = latest.nop_luc
      GROUP BY latest.ma_ket_qua
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT nguoi_dung_id) AS total
      FROM ket_qua_danh_gia
    `,
    prisma.user.count(),
  ]);

  const completedUsers = Number(distinctCompletedRows[0]?.total || 0);

  const resultDistribution = assessmentCatalog.resultOrder.map((resultCode) => {
    const matched = latestRows.find((item) => item.resultCode === resultCode);
    return {
      resultCode,
      total: Number(matched?.total || 0),
    };
  });

  return {
    totalAttempts,
    completedUsers,
    completionRate: totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0,
    resultDistribution,
  };
};

export const getAssessmentSummaryForUser = async ({ userId }: { userId: bigint }) => {
  const latest = await getLatestAttempt({ userId });
  return {
    latestAttempt: latest,
  };
};
