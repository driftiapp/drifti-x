/**
 * Error codes used throughout the application
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

/**
 * Metadata associated with an error
 */
export interface ErrorMetadata {
  code: ErrorCode;
  context?: Record<string, unknown>;
  fingerprint?: string[];
}

/**
 * Base error class for the application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly metadata: ErrorMetadata;

  constructor(message: string, statusCode: number, metadata: ErrorMetadata) {
    super(message);
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, {
      code: ErrorCode.VALIDATION_ERROR,
      context
    });
  }
}

/**
 * Error thrown when authentication fails
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 401, {
      code: ErrorCode.UNAUTHORIZED,
      context
    });
  }
}

/**
 * Error thrown when authorization fails
 */
export class ForbiddenError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 403, {
      code: ErrorCode.FORBIDDEN,
      context
    });
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 404, {
      code: ErrorCode.NOT_FOUND,
      context
    });
  }
}

/**
 * Error thrown when there's a conflict with existing data
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, {
      code: ErrorCode.CONFLICT,
      context
    });
  }
}

/**
 * Error thrown when there's a database operation failure
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 500, {
      code: ErrorCode.DATABASE_ERROR,
      context
    });
  }
}

/**
 * Error thrown when an external service call fails
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 502, {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      context
    });
  }
} 