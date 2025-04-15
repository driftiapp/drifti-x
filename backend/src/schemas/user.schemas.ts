import { z } from 'zod';
import { UserRole, userRoleSchema } from '../types/user';

/**
 * Schema for user creation
 */
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: userRoleSchema,
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  preferredLanguage: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    push: z.boolean().default(true)
  }).optional()
});

/**
 * Schema for user update
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  isActive: z.boolean().optional(),
  preferredLanguage: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional()
  }).optional()
});

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional()
});

/**
 * Schema for password reset request
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

/**
 * Schema for password reset
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
});

/**
 * Schema for email verification
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1)
});

/**
 * Schema for phone verification
 */
export const phoneVerificationSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  code: z.string().min(4).max(6)
});

/**
 * Schema for role update
 */
export const roleUpdateSchema = z.object({
  role: userRoleSchema,
  reason: z.string().min(10).max(500).optional(),
  updatedBy: z.string().min(1).optional()
});

/**
 * Schema for user search/filter
 */
export const userFilterSchema = z.object({
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  isPhoneVerified: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastLogin', 'email', 'firstName', 'lastName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type PhoneVerificationInput = z.infer<typeof phoneVerificationSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>; 