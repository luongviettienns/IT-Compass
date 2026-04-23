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

export type RegisterBody = z.infer<typeof registerSchema.shape.body>;
export type LoginBody = z.infer<typeof loginSchema.shape.body>;
export type TokenOnlyBody = z.infer<typeof tokenOnlySchema.shape.body>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema.shape.body>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.shape.body>;
