import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { IUserDocument, IUserModel, IUserInput, UserRole } from '../types/user';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Interface for user document
 * @interface IUser
 */
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'driver' | 'store';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for user document with Mongoose methods
 * @interface IUserDocument
 */
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): IUser;
}

/**
 * Zod schema for validating user data
 */
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phoneNumber: z.string().min(10),
  role: z.enum(['user', 'admin', 'driver', 'store']),
  isActive: z.boolean().default(true)
});

/**
 * Mongoose schema for user model
 */
const userMongooseSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    emailVerifiedAt: {
      type: Date
    },
    phoneVerifiedAt: {
      type: Date
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationTokenExpires: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetTokenExpires: {
      type: Date,
      select: false
    },
    preferredLanguage: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
userMongooseSchema.index({ email: 1 });
userMongooseSchema.index({ role: 1 });
userMongooseSchema.index({ isActive: 1 });
userMongooseSchema.index({ emailVerificationToken: 1 });
userMongooseSchema.index({ passwordResetToken: 1 });

/**
 * Pre-save middleware to hash password
 */
userMongooseSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Method to compare password with hashed password
 */
userMongooseSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to generate password reset token
 */
userMongooseSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return resetToken;
};

/**
 * Method to generate email verification token
 */
userMongooseSchema.methods.generateEmailVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

/**
 * Static method to find user by email
 */
userMongooseSchema.statics.findByEmail = async function(
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email }).select('+password');
};

/**
 * Static method to find user by reset token
 */
userMongooseSchema.statics.findByResetToken = async function(
  token: string
): Promise<IUserDocument | null> {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() }
  });
};

/**
 * Static method to find user by verification token
 */
userMongooseSchema.statics.findByVerificationToken = async function(
  token: string
): Promise<IUserDocument | null> {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: { $gt: Date.now() }
  });
};

/**
 * Static method to create a new user
 */
userMongooseSchema.statics.createUser = async function(
  userData: IUserInput
): Promise<IUserDocument> {
  return this.create(userData);
};

/**
 * Static method to set password reset token
 */
userMongooseSchema.statics.setPasswordResetToken = async function(
  userId: string,
  token: string
): Promise<void> {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  await this.findByIdAndUpdate(userId, {
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: new Date(Date.now() + 30 * 60 * 1000)
  });
};

/**
 * Static method to set email verification token
 */
userMongooseSchema.statics.setEmailVerificationToken = async function(
  userId: string,
  token: string
): Promise<void> {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  await this.findByIdAndUpdate(userId, {
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
};

/**
 * Static method to verify email
 */
userMongooseSchema.statics.verifyEmail = async function(
  token: string
): Promise<boolean> {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: { $gt: Date.now() }
  });

  if (!user) return false;

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();

  return true;
};

/**
 * Static method to reset password
 */
userMongooseSchema.statics.resetPassword = async function(
  token: string,
  newPassword: string
): Promise<boolean> {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await this.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() }
  });

  if (!user) return false;

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  return true;
};

/**
 * User model
 */
export const UserModel = model<IUserDocument, IUserModel>('User', userMongooseSchema); 