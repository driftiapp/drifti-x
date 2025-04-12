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

export interface ErrorMetadata {
  code: ErrorCode;
  context?: Record<string, unknown>;
  fingerprint?: string[];
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly metadata: ErrorMetadata;

  constructor(message: string, statusCode: number, metadata: ErrorMetadata) {
    super(message);
    this.statusCode = statusCode;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata: ErrorMetadata) {
    super(message, 400, {
      ...metadata,
      code: ErrorCode.VALIDATION_ERROR
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, metadata: ErrorMetadata) {
    super(message, 401, {
      ...metadata,
      code: ErrorCode.UNAUTHORIZED
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, metadata: ErrorMetadata) {
    super(message, 403, {
      ...metadata,
      code: ErrorCode.FORBIDDEN
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, metadata: ErrorMetadata) {
    super(message, 404, {
      ...metadata,
      code: ErrorCode.NOT_FOUND
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata: ErrorMetadata) {
    super(message, 409, {
      ...metadata,
      code: ErrorCode.CONFLICT
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata: ErrorMetadata) {
    super(message, 500, {
      ...metadata,
      code: ErrorCode.DATABASE_ERROR
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, metadata: ErrorMetadata) {
    super(message, 502, {
      ...metadata,
      code: ErrorCode.EXTERNAL_SERVICE_ERROR
    });
  }
} 