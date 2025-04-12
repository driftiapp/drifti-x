import { logger } from './logger';
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode, ErrorMetadata } from './AppError';

interface ErrorOptions {
  context?: Record<string, unknown>;
  fingerprint?: string[];
  statusCode?: number;
}

export class AppError extends Error {
  public readonly context?: Record<string, unknown>;
  public readonly fingerprint?: string[];
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata: ErrorMetadata;

  constructor(message: string, statusCode: number, metadata: ErrorMetadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = metadata.context;
    this.fingerprint = metadata.fingerprint;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.metadata = metadata;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specialized error types
export class ValidationError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 400, {
      ...metadata,
      code: ErrorCode.VALIDATION_ERROR
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 401, {
      ...metadata,
      code: ErrorCode.UNAUTHORIZED
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 403, {
      ...metadata,
      code: ErrorCode.FORBIDDEN
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 404, {
      ...metadata,
      code: ErrorCode.NOT_FOUND
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 409, {
      ...metadata,
      code: ErrorCode.CONFLICT
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 500, {
      ...metadata,
      code: ErrorCode.DATABASE_ERROR
    });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 429, {
      ...metadata,
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      fingerprint: ['RATE_LIMIT_ERROR', ...(metadata.fingerprint || [])]
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 503, {
      ...metadata,
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      fingerprint: ['SERVICE_UNAVAILABLE', ...(metadata.fingerprint || [])]
    });
  }
}

export class PaymentError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 402, {
      ...metadata,
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      fingerprint: ['PAYMENT_ERROR', ...(metadata.fingerprint || [])]
    });
  }
}

export class ThirdPartyAPIError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 502, {
      ...metadata,
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      fingerprint: ['THIRD_PARTY_API_ERROR', ...(metadata.fingerprint || [])]
    });
  }
}

export class InvalidSignatureError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, 400, { ...options, code: ErrorCode.INVALID_SIGNATURE_ERROR });
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, 402, { ...options, code: ErrorCode.PAYMENT_REQUIRED_ERROR });
  }
}

export class BadGatewayError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, 502, { ...options, code: ErrorCode.BAD_GATEWAY_ERROR });
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 400, {
      ...metadata,
      code: ErrorCode.BAD_REQUEST
    });
  }
}

// Error handling utility
export const handleError = (error: Error): Record<string, unknown> => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...(error instanceof AppError && {
      context: error.metadata.context,
      fingerprint: error.metadata.fingerprint,
      code: error.metadata.code
    })
  });

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      isOperational: error.isOperational,
      metadata: error.metadata
    };
  }

  // Handle unknown errors
  logger.error('Unexpected error occurred', {
    error: error.message,
    stack: error.stack
  });

  return {
    statusCode: 500,
    message: 'An unexpected error occurred',
    isOperational: false,
    metadata: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      fingerprint: ['UNKNOWN_ERROR']
    }
  };
};

// Global error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      metadata: err.metadata,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      metadata: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error: err },
        fingerprint: ['internal-server-error']
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
}; 