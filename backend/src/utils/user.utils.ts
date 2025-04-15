import { IUserDocument, IUserPublic, UserRole } from '../types/user';
import { sign } from 'jsonwebtoken';
import { config } from '../config/config';

/**
 * Sanitizes a user document for public consumption
 * @param user The user document to sanitize
 * @param options Optional configuration for field inclusion/exclusion
 * @returns A sanitized user object
 */
export function sanitizeUser(
  user: IUserDocument,
  options: {
    include?: (keyof IUserPublic)[];
    exclude?: (keyof IUserPublic)[];
  } = {}
): IUserPublic {
  const {
    _id,
    email,
    firstName,
    lastName,
    role,
    phoneNumber,
    isActive,
    lastLogin,
    isEmailVerified,
    isPhoneVerified,
    preferredLanguage,
    timezone,
    notificationPreferences
  } = user;

  const sanitized: IUserPublic = {
    _id: _id.toString(),
    email,
    firstName,
    lastName,
    role,
    phoneNumber,
    isActive,
    lastLogin,
    isEmailVerified,
    isPhoneVerified,
    preferredLanguage,
    timezone,
    notificationPreferences
  };

  // Apply include/exclude options
  if (options.include) {
    return Object.fromEntries(
      Object.entries(sanitized).filter(([key]) => options.include?.includes(key as keyof IUserPublic))
    ) as IUserPublic;
  }

  if (options.exclude) {
    return Object.fromEntries(
      Object.entries(sanitized).filter(([key]) => !options.exclude?.includes(key as keyof IUserPublic))
    ) as IUserPublic;
  }

  return sanitized;
}

/**
 * Checks if a user has admin role
 * @param user The user to check
 * @returns Whether the user is an admin
 */
export function isAdmin(user: IUserDocument | IUserPublic): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Generates an authentication response with JWT token
 * @param user The user to generate the response for
 * @returns Authentication response with token and user data
 */
export function generateAuthResponse(user: IUserDocument): {
  token: string;
  user: IUserPublic;
} {
  const token = sign(
    { id: user._id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    token,
    user: sanitizeUser(user)
  };
}

/**
 * Generates a password reset token
 * @returns A random token string
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates an email verification token
 * @returns A random token string
 */
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a token using SHA-256
 * @param token The token to hash
 * @returns The hashed token
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Checks if a token is expired
 * @param expiresAt The expiration date
 * @returns Whether the token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

/**
 * Generates a random verification code
 * @param length The length of the code (default: 6)
 * @returns A random numeric code
 */
export function generateVerificationCode(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
} 