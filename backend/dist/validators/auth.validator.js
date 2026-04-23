import { z } from 'zod';
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters');
const fullNameSchema = z.string().trim().min(2).max(150);
const emailSchema = z.string().trim().email().max(191);
const roleSchema = z.enum(['STUDENT', 'MENTOR']).default('STUDENT');
export const registerSchema = z.object({
    body: z.object({
        fullName: fullNameSchema,
        email: emailSchema,
        password: passwordSchema,
        role: roleSchema,
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: passwordSchema,
    }),
});
export const tokenOnlySchema = z.object({
    body: z.object({
        token: z.string().trim().min(20).max(255),
    }),
});
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: emailSchema,
    }),
});
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().trim().min(20).max(255),
        newPassword: passwordSchema,
    }),
});
