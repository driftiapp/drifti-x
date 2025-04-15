import { Types, Document, Model } from 'mongoose';
import { z } from 'zod';

/**
 * Enum representing the possible roles a user can have in the system
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  STORE_OWNER = 'STORE_OWNER'
}

/**
 * Zod schema for validating user roles
 */
export const userRoleSchema = z.nativeEnum(UserRole);

/**
 * Zod schema for email validation
 */
export const emailSchema = z.string().email();

/**
 * Zod schema for phone number validation
 */
export const phoneNumberSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

/**
 * Base interface for user data
 */
export interface IUserBase {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  preferredLanguage?: string;
  timezone?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

/**
 * Interface for user input during creation
 */
export interface IUserInput extends Omit<IUserBase, 'isEmailVerified' | 'isPhoneVerified' | 'emailVerifiedAt' | 'phoneVerifiedAt'> {
  password: string;
}

/**
 * Interface representing a user document in MongoDB
 */
export interface IUserDocument extends IUserBase, Document {
  _id: Types.ObjectId;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
}

/**
 * Interface for the User model with static methods
 */
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByResetToken(token: string): Promise<IUserDocument | null>;
  findByVerificationToken(token: string): Promise<IUserDocument | null>;
  createUser(userData: IUserInput): Promise<IUserDocument>;
  setPasswordResetToken(userId: string, token: string): Promise<void>;
  setEmailVerificationToken(userId: string, token: string): Promise<void>;
  verifyEmail(token: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
}

/**
 * Interface for public user data (sent to frontend)
 */
export interface IUserPublic {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferredLanguage?: string;
  timezone?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

/**
 * Function to convert a user document to public format
 */
export function toPublicUser(user: IUserDocument): IUserPublic {
  return {
    _id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phoneNumber: user.phoneNumber,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    preferredLanguage: user.preferredLanguage,
    timezone: user.timezone,
    notificationPreferences: user.notificationPreferences
  };
}

/**
 * Interface representing a user in the database
 */
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  preferredLanguage?: string;
  timezone?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

/**
 * Zod schema for validating user data
 */
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: userRoleSchema,
  phoneNumber: z.string().optional(),
  isActive: z.boolean().default(true),
  lastLogin: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Interface representing a user's profile information
 * This is a subset of IUser used for public-facing data
 */
export interface IUserProfile {
  _id: Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
}

/**
 * Zod schema for validating user profile data
 */
export const userProfileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: userRoleSchema,
  phoneNumber: z.string().optional(),
  isActive: z.boolean(),
  lastLogin: z.date().optional()
});

/**
 * Interface for creating a new user
 */
export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  preferredLanguage?: string;
  timezone?: string;
}

/**
 * Zod schema for validating user creation data
 */
export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: userRoleSchema,
  phoneNumber: z.string().optional()
});

/**
 * Interface for updating an existing user
 */
export interface IUserUpdate {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive?: boolean;
  preferredLanguage?: string;
  timezone?: string;
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}

/**
 * Zod schema for validating user update data
 */
export const userUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional()
});

/**
 * Interface for user login credentials
 */
export interface IUserLogin {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Zod schema for validating user login data
 */
export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

/**
 * Interface for user password reset request
 */
export interface IUserPasswordReset {
  email: string;
}

/**
 * Zod schema for validating password reset request
 */
export const userPasswordResetSchema = z.object({
  email: z.string().email()
});

/**
 * Interface for user password update
 */
export interface IUserPasswordUpdate {
  currentPassword: string;
  newPassword: string;
}

/**
 * Zod schema for validating password update
 */
export const userPasswordUpdateSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});

/**
 * Interface for user email verification
 */
export interface IUserEmailVerification {
  token: string;
}

/**
 * Zod schema for validating email verification
 */
export const userEmailVerificationSchema = z.object({
  token: z.string().min(1)
});

/**
 * Interface for user phone verification
 */
export interface IUserPhoneVerification {
  phoneNumber: string;
  code: string;
}

/**
 * Zod schema for validating phone verification
 */
export const userPhoneVerificationSchema = z.object({
  phoneNumber: z.string().min(10),
  code: z.string().min(4).max(6)
});

/**
 * Interface for user role update
 */
export interface IUserRoleUpdate {
  role: UserRole;
  reason?: string;
  updatedBy?: Types.ObjectId;
}

/**
 * Zod schema for validating role update
 */
export const userRoleUpdateSchema = z.object({
  role: userRoleSchema
});

/**
 * Interface for user status update
 */
export interface IUserStatusUpdate {
  isActive: boolean;
  reason?: string;
  updatedBy?: Types.ObjectId;
}

/**
 * Zod schema for validating status update
 */
export const userStatusUpdateSchema = z.object({
  isActive: z.boolean()
});

/**
 * Interface for user search criteria
 */
export interface IUserSearchCriteria {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  preferredLanguage?: string;
  timezone?: string;
}

/**
 * Zod schema for validating search criteria
 */
export const userSearchCriteriaSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  preferredLanguage: z.string().optional(),
  timezone: z.string().optional()
});

/**
 * Interface for paginated user results
 */
export interface IUserPaginatedResult {
  users: IUserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Zod schema for validating paginated results
 */
export const userPaginatedResultSchema = z.object({
  users: z.array(userProfileSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0)
});

/**
 * Interface for user statistics
 */
export interface IUserStats {
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  activeUsers: number;
  emailVerifiedUsers: number;
  phoneVerifiedUsers: number;
  usersByLanguage: Record<string, number>;
  usersByTimezone: Record<string, number>;
}

/**
 * Interface for user analytics
 */
export interface IUserAnalytics {
  stats: IUserStats;
  trend: {
    date: Date;
    newUsers: number;
    activeUsers: number;
    verifiedUsers: number;
  }[];
} 