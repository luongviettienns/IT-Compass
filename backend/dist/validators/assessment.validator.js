import { z } from 'zod';
import { HOLLAND_QUESTION_IDS, SITUATIONAL_OPTION_IDS } from '../services/assessment.constants.js';
const attemptIdParam = z.object({
    params: z.object({
        attemptId: z.string().regex(/^\d+$/),
    }),
});
const hollandAnswersSchema = z
    .record(z.string(), z.coerce.number().int().min(1).max(5))
    // superRefine buộc client gửi đủ bộ câu hỏi hiện hành thay vì chỉ kiểm tra value hợp lệ từng field rời rạc.
    .superRefine((value, ctx) => {
    for (const questionId of HOLLAND_QUESTION_IDS) {
        if (!(questionId in value)) {
            ctx.addIssue({
                code: 'custom',
                path: [questionId],
                message: 'Thiếu câu trả lời Holland',
            });
        }
    }
});
const situationalAnswersSchema = z
    .record(z.string(), z.string())
    // Validate theo whitelist option hiện tại để frontend cũ hoặc payload sửa tay không lưu được đáp án ngoài catalog.
    .superRefine((value, ctx) => {
    Object.entries(SITUATIONAL_OPTION_IDS).forEach(([questionId, allowedOptionIds]) => {
        const answer = value[questionId];
        if (!answer) {
            ctx.addIssue({
                code: 'custom',
                path: [questionId],
                message: 'Thiếu câu trả lời tình huống',
            });
            return;
        }
        if (!allowedOptionIds.includes(answer)) {
            ctx.addIssue({
                code: 'custom',
                path: [questionId],
                message: 'Đáp án tình huống không hợp lệ',
            });
        }
    });
});
export const getCurrentAssessmentTemplateSchema = z.object({
    query: z.object({}).optional().default({}),
});
export const submitAssessmentAttemptSchema = z.object({
    body: z.object({
        startedAt: z.string().datetime().optional(),
        hollandAnswers: hollandAnswersSchema,
        situationalAnswers: situationalAnswersSchema,
    }),
});
export const getAssessmentHistorySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    }),
});
export const getLatestAssessmentAttemptSchema = z.object({
    query: z.object({}).optional().default({}),
});
export const getAssessmentAttemptByIdSchema = attemptIdParam;
export const getAdminAssessmentStatsSchema = z.object({
    query: z.object({}).optional().default({}),
});
