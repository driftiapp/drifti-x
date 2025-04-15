import { Types } from 'mongoose';

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
}

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
 * Interface for creating a new user
 */
export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
}

/**
 * Interface for updating an existing user
 */
export interface IUserUpdate {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

/**
 * Interface for user login credentials
 */
export interface IUserLogin {
  email: string;
  password: string;
}

/**
 * Interface for user password reset request
 */
export interface IUserPasswordReset {
  email: string;
}

/**
 * Interface for user password update
 */
export interface IUserPasswordUpdate {
  currentPassword: string;
  newPassword: string;
}

/**
 * Interface for user email verification
 */
export interface IUserEmailVerification {
  token: string;
}

/**
 * Interface for user phone verification
 */
export interface IUserPhoneVerification {
  phoneNumber: string;
  code: string;
}

/**
 * Interface for user role update
 */
export interface IUserRoleUpdate {
  role: UserRole;
}

/**
 * Interface for user status update
 */
export interface IUserStatusUpdate {
  isActive: boolean;
}

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
}

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