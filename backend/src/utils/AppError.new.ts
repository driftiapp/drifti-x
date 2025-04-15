import { logger } from './logger';
import { z } from 'zod';
import { ErrorCode } from '../types/error';

/**
 * HTTP status codes mapped to error codes
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.CONFIGURATION_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 500,
  [ErrorCode.TIMEOUT_ERROR]: 504,
  [ErrorCode.PAYMENT_ERROR]: 402,
  [ErrorCode.DELIVERY_ERROR]: 500,
  [ErrorCode.ORDER_ERROR]: 400,
  [ErrorCode.USER_ERROR]: 400,
  [ErrorCode.STORE_ERROR]: 400,
  [ErrorCode.DRIVER_ERROR]: 400,
  [ErrorCode.PRODUCT_ERROR]: 400,
  [ErrorCode.CART_ERROR]: 400,
  [ErrorCode.ADDRESS_ERROR]: 400,
  [ErrorCode.REVIEW_ERROR]: 400,
  [ErrorCode.NOTIFICATION_ERROR]: 500,
  [ErrorCode.FILE_ERROR]: 500,
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.QUEUE_ERROR]: 500,
  [ErrorCode.EMAIL_ERROR]: 500,
  [ErrorCode.SMS_ERROR]: 500,
  [ErrorCode.PUSH_ERROR]: 500,
  [ErrorCode.WEBHOOK_ERROR]: 500,
  [ErrorCode.API_ERROR]: 500,
  [ErrorCode.THIRD_PARTY_ERROR]: 502,
  [ErrorCode.INTEGRATION_ERROR]: 500,
  [ErrorCode.MIGRATION_ERROR]: 500,
  [ErrorCode.DEPLOYMENT_ERROR]: 500,
  [ErrorCode.MAINTENANCE_ERROR]: 503,
  [ErrorCode.UPGRADE_ERROR]: 500,
  [ErrorCode.ROLLBACK_ERROR]: 500,
  [ErrorCode.BACKUP_ERROR]: 500,
  [ErrorCode.RESTORE_ERROR]: 500,
  [ErrorCode.SECURITY_ERROR]: 500,
  [ErrorCode.COMPLIANCE_ERROR]: 500,
  [ErrorCode.AUDIT_ERROR]: 500,
  [ErrorCode.MONITORING_ERROR]: 500,
  [ErrorCode.LOGGING_ERROR]: 500,
  [ErrorCode.METRICS_ERROR]: 500,
  [ErrorCode.ALERT_ERROR]: 500,
  [ErrorCode.REPORT_ERROR]: 500,
  [ErrorCode.ANALYTICS_ERROR]: 500,
  [ErrorCode.BILLING_ERROR]: 500,
  [ErrorCode.INVOICE_ERROR]: 500,
  [ErrorCode.PAYOUT_ERROR]: 500,
  [ErrorCode.REFUND_ERROR]: 500,
  [ErrorCode.TAX_ERROR]: 500,
  [ErrorCode.CURRENCY_ERROR]: 500,
  [ErrorCode.EXCHANGE_ERROR]: 500,
  [ErrorCode.WALLET_ERROR]: 500,
  [ErrorCode.TRANSACTION_ERROR]: 500,
  [ErrorCode.BALANCE_ERROR]: 500,
  [ErrorCode.CREDIT_ERROR]: 500,
  [ErrorCode.DEBIT_ERROR]: 500,
  [ErrorCode.FRAUD_ERROR]: 500,
  [ErrorCode.VERIFICATION_ERROR]: 500
};

/**
 * Interface for error metadata
 */
export interface ErrorMetadata {
  code?: ErrorCode;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Zod schema for error metadata validation
 */
export const errorMetadataSchema = z.object({
  code: z.nativeEnum(ErrorCode).optional(),
  context: z.record(z.unknown()).optional(),
  fingerprint: z.array(z.string()).optional(),
  timestamp: z.date().optional(),
  requestId: z.string().optional(),
  userId: z.string().optional(),
  source: z.string().optional()
});

/**
 * Base error class for the application
 * Extends the built-in Error class with additional properties for better error handling
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, code: ErrorCode, metadata?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.metadata = metadata;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Creates a JSON representation of the error
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
      stack: this.stack
    };
  }

  /**
   * Checks if an error is an AppError
   */
  public static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

/**
 * Error class for validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, { context });
  }
}

/**
 * Error class for unauthorized access
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.UNAUTHORIZED, { context });
  }
}

/**
 * Error class for forbidden access
 */
export class ForbiddenError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.FORBIDDEN, { context });
  }
}

/**
 * Error class for not found resources
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.NOT_FOUND, { context });
  }
}

/**
 * Error class for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.CONFLICT, { context });
  }
}

/**
 * Error class for database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.DATABASE_ERROR, { context });
  }
}

/**
 * Error class for internal server errors
 */
export class InternalError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.INTERNAL_ERROR, { context });
  }
} 