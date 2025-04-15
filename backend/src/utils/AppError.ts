import { logger } from './baseLogger';
import { z } from 'zod';
import { ErrorCode, ErrorType } from '../types/error';
import type { ErrorMetadata } from '../types/error';

export interface AppErrorOptions {
  errorType?: string;
  errorSource?: string;
  metadata?: Record<string, unknown>;
}

/**
 * HTTP status codes mapped to error codes
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // Validation errors (1000-1999)
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_LENGTH]: 400,
  [ErrorCode.INVALID_VALUE]: 400,

  // Authentication errors (2000-2999)
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,

  // Resource errors (3000-3999)
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.DUPLICATE_RESOURCE]: 409,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.INVALID_STATUS]: 400,

  // Technical errors (4000-4999)
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.CONFIGURATION_ERROR]: 500,
  [ErrorCode.TIMEOUT_ERROR]: 504,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.QUEUE_ERROR]: 500,
  [ErrorCode.FILE_ERROR]: 500,

  // Business errors (5000-5999)
  [ErrorCode.PAYMENT_ERROR]: 400,
  [ErrorCode.DELIVERY_ERROR]: 400,
  [ErrorCode.ORDER_ERROR]: 400,
  [ErrorCode.USER_ERROR]: 400,
  [ErrorCode.STORE_ERROR]: 400,
  [ErrorCode.DRIVER_ERROR]: 400,
  [ErrorCode.PRODUCT_ERROR]: 400,
  [ErrorCode.CART_ERROR]: 400,
  [ErrorCode.ADDRESS_ERROR]: 400,
  [ErrorCode.REVIEW_ERROR]: 400,

  // Communication errors (6000-6999)
  [ErrorCode.NOTIFICATION_ERROR]: 500,
  [ErrorCode.EMAIL_ERROR]: 500,
  [ErrorCode.SMS_ERROR]: 500,
  [ErrorCode.PUSH_ERROR]: 500,
  [ErrorCode.WEBHOOK_ERROR]: 500,
  [ErrorCode.API_ERROR]: 500,

  // Integration errors (7000-7999)
  [ErrorCode.THIRD_PARTY_ERROR]: 502,
  [ErrorCode.INTEGRATION_ERROR]: 502,
  [ErrorCode.MIGRATION_ERROR]: 500,
  [ErrorCode.DEPLOYMENT_ERROR]: 500,

  // System errors (8000-8999)
  [ErrorCode.MAINTENANCE_ERROR]: 503,
  [ErrorCode.UPGRADE_ERROR]: 503,
  [ErrorCode.ROLLBACK_ERROR]: 500,
  [ErrorCode.BACKUP_ERROR]: 500,
  [ErrorCode.RESTORE_ERROR]: 500,

  // Security errors (9000-9999)
  [ErrorCode.SECURITY_ERROR]: 403,
  [ErrorCode.COMPLIANCE_ERROR]: 403,
  [ErrorCode.FRAUD_ERROR]: 403,
  [ErrorCode.VERIFICATION_ERROR]: 403,

  // Monitoring errors (10000-10999)
  [ErrorCode.AUDIT_ERROR]: 500,
  [ErrorCode.MONITORING_ERROR]: 500,
  [ErrorCode.LOGGING_ERROR]: 500,
  [ErrorCode.METRICS_ERROR]: 500,
  [ErrorCode.ALERT_ERROR]: 500,
  [ErrorCode.REPORT_ERROR]: 500,
  [ErrorCode.ANALYTICS_ERROR]: 500,

  // Financial errors (11000-11999)
  [ErrorCode.BILLING_ERROR]: 400,
  [ErrorCode.INVOICE_ERROR]: 400,
  [ErrorCode.PAYOUT_ERROR]: 400,
  [ErrorCode.REFUND_ERROR]: 400,
  [ErrorCode.TAX_ERROR]: 400,
  [ErrorCode.CURRENCY_ERROR]: 400,
  [ErrorCode.EXCHANGE_ERROR]: 400,
  [ErrorCode.WALLET_ERROR]: 400,
  [ErrorCode.TRANSACTION_ERROR]: 400,
  [ErrorCode.BALANCE_ERROR]: 400,
  [ErrorCode.CREDIT_ERROR]: 400,
  [ErrorCode.DEBIT_ERROR]: 400,

  // Rate limiting (12000-12999)
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429
};

/**
 * Base error class for the application with enhanced functionality
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly errorType: string;
  public readonly errorSource: string;
  public readonly metadata: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly originalError?: Error;
  public readonly statusCode: ErrorCode;
  public readonly isOperational: boolean;

  constructor(
    statusCode: ErrorCode,
    message: string,
    options: AppErrorOptions = {},
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorType = options.errorType || 'UNKNOWN';
    this.errorSource = options.errorSource || 'UNKNOWN';
    this.metadata = options.metadata || {};
    this.timestamp = new Date();
    this.originalError = originalError;
    this.isOperational = this.errorType !== ErrorType.TECHNICAL;

    // Log error
    logger.error(message, {
      errorCode: this.statusCode,
      statusCode: this.getHttpStatus(),
      stack: this.stack
    });
  }

  public getHttpStatus(): number {
    return ERROR_STATUS_CODES[this.statusCode] || 500;
  }

  /**
   * Creates a JSON representation of the error
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.statusCode,
      statusCode: this.getHttpStatus(),
      metadata: this.metadata,
      errorType: this.errorType,
      errorSource: this.errorSource,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Checks if an error is an AppError
   */
  public static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }

  /**
   * Checks if the error is operational (expected) or programming (unexpected)
   */
  public isOperational(): boolean {
    return this.isOperational;
  }

  /**
   * Checks if the error is retryable
   */
  public isRetryable(): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.QUEUE_ERROR
    ].includes(this.statusCode);
  }

  /**
   * Gets the error severity level
   */
  public getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.errorType === ErrorType.TECHNICAL) {
      return 'critical';
    }
    if (this.errorType === ErrorType.SECURITY) {
      return 'high';
    }
    if (this.errorType === ErrorType.BUSINESS) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Factory methods for common error types
   */
  public static validation(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      message,
      { errorType: 'VALIDATION', errorSource: 'validation', metadata }
    );
  }

  public static unauthorized(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.UNAUTHORIZED,
      message,
      { errorType: 'SECURITY', errorSource: 'auth', metadata }
    );
  }

  public static forbidden(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.FORBIDDEN,
      message,
      { errorType: 'SECURITY', errorSource: 'auth', metadata }
    );
  }

  public static notFound(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.NOT_FOUND,
      message,
      { errorType: 'BUSINESS', errorSource: 'resource', metadata }
    );
  }

  public static conflict(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.CONFLICT,
      message,
      { errorType: 'BUSINESS', errorSource: 'resource', metadata }
    );
  }

  public static database(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.DATABASE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'database', metadata }
    );
  }

  public static internal(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'system', metadata }
    );
  }

  public static rateLimit(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      { errorType: 'TECHNICAL', errorSource: 'rate-limit', metadata }
    );
  }

  public static externalService(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'external-service', metadata }
    );
  }

  public static payment(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.PAYMENT_ERROR,
      message,
      { errorType: 'BUSINESS', errorSource: 'payment', metadata }
    );
  }

  public static delivery(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.DELIVERY_ERROR,
      message,
      { errorType: 'BUSINESS', errorSource: 'delivery', metadata }
    );
  }

  public static configuration(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.CONFIGURATION_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'configuration', metadata }
    );
  }

  public static network(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'network', metadata }
    );
  }

  public static timeout(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.TIMEOUT_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'timeout', metadata }
    );
  }

  public static cache(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.CACHE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'cache', metadata }
    );
  }

  public static queue(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.QUEUE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'queue', metadata }
    );
  }

  public static notification(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.NOTIFICATION_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'notification', metadata }
    );
  }

  public static file(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.FILE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'file', metadata }
    );
  }

  public static security(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.SECURITY_ERROR,
      message,
      { errorType: 'SECURITY', errorSource: 'security', metadata }
    );
  }

  public static compliance(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.COMPLIANCE_ERROR,
      message,
      { errorType: 'SECURITY', errorSource: 'compliance', metadata }
    );
  }

  public static fraud(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.FRAUD_ERROR,
      message,
      { errorType: 'SECURITY', errorSource: 'fraud', metadata }
    );
  }

  public static verification(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.VERIFICATION_ERROR,
      message,
      { errorType: 'SECURITY', errorSource: 'verification', metadata }
    );
  }

  public static maintenance(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.MAINTENANCE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'maintenance', metadata }
    );
  }

  public static upgrade(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.UPGRADE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'upgrade', metadata }
    );
  }

  public static backup(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.BACKUP_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'backup', metadata }
    );
  }

  public static restore(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.RESTORE_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'restore', metadata }
    );
  }

  public static audit(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.AUDIT_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'audit', metadata }
    );
  }

  public static monitoring(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.MONITORING_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'monitoring', metadata }
    );
  }

  public static logging(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.LOGGING_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'logging', metadata }
    );
  }

  public static metrics(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.METRICS_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'metrics', metadata }
    );
  }

  public static alert(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.ALERT_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'alert', metadata }
    );
  }

  public static report(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.REPORT_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'report', metadata }
    );
  }

  public static analytics(message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.ANALYTICS_ERROR,
      message,
      { errorType: 'TECHNICAL', errorSource: 'analytics', metadata }
    );
  }
}

/**
 * Enhanced Zod schema for error metadata validation with additional rules
 */
export const errorMetadataSchema = z.object({
  code: z.nativeEnum(ErrorCode).optional(),
  context: z.record(z.unknown()).optional(),
  fingerprint: z.array(z.string()).optional(),
  timestamp: z.date().optional(),
  requestId: z.string().uuid().optional(),
  userId: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  details: z.array(z.string()).optional(),
  retryable: z.boolean().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isOperational: z.boolean().optional(),
  stack: z.string().optional(),
  correlationId: z.string().uuid().optional(),
  retryCount: z.number().int().min(0).optional(),
  maxRetries: z.number().int().min(0).optional(),
  retryAfter: z.number().int().min(0).optional(),
  errorGroup: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  affectedUsers: z.array(z.string()).optional(),
  affectedResources: z.array(z.string()).optional(),
  suggestedActions: z.array(z.string()).optional(),
  documentationUrl: z.string().url().optional(),
  supportContact: z.string().email().optional(),
  errorChain: z.array(z.instanceof(AppError)).optional(),
  parentError: z.instanceof(AppError).optional(),
  errorType: z.enum(['business', 'technical', 'security', 'compliance']).optional(),
  errorCategory: z.string().min(1).optional(),
  errorSubCategory: z.string().min(1).optional(),
  errorSource: z.enum(['client', 'server', 'third_party', 'infrastructure']).optional(),
  errorImpact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  errorPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  errorResolution: z.enum(['automatic', 'manual', 'none']).optional(),
  errorState: z.enum(['active', 'resolved', 'investigating', 'mitigated']).optional(),
  errorTimeToResolve: z.number().int().min(0).optional(),
  errorTimeToDetect: z.number().int().min(0).optional(),
  errorDetectionSource: z.string().min(1).optional(),
  errorRootCause: z.string().min(1).optional(),
  errorMitigation: z.string().min(1).optional(),
  errorPrevention: z.string().min(1).optional(),
  errorMetrics: z.object({
    occurrenceCount: z.number().int().min(0).optional(),
    userImpactCount: z.number().int().min(0).optional(),
    systemImpactCount: z.number().int().min(0).optional(),
    financialImpact: z.number().min(0).optional()
  }).optional()
}).refine((data) => {
  if (data.severity === 'critical' && !data.retryable) {
    return false;
  }
  if (data.errorImpact === 'critical' && data.errorPriority !== 'urgent') {
    return false;
  }
  if (data.errorState === 'resolved' && !data.errorResolution) {
    return false;
  }
  return true;
}, {
  message: 'Critical errors must be retryable',
  path: ['severity']
}).refine((data) => {
  if (data.retryCount !== undefined && data.maxRetries !== undefined) {
    return data.retryCount <= data.maxRetries;
  }
  return true;
}, {
  message: 'Retry count cannot exceed max retries',
  path: ['retryCount']
});

/**
 * Error class for validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.VALIDATION_ERROR, message, {
      errorType: ErrorType.VALIDATION,
      errorSource: 'validation',
      metadata
    });
  }
}

/**
 * Error class for unauthorized access
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.UNAUTHORIZED, message, {
      errorType: ErrorType.SECURITY,
      errorSource: 'auth',
      metadata
    });
  }
}

/**
 * Error class for forbidden access
 */
export class ForbiddenError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.FORBIDDEN, message, {
      errorType: ErrorType.SECURITY,
      errorSource: 'auth',
      metadata
    });
  }
}

/**
 * Error class for not found resources
 */
export class NotFoundError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.NOT_FOUND, message, {
      errorType: ErrorType.BUSINESS,
      errorSource: 'resource',
      metadata
    });
  }
}

/**
 * Error class for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.CONFLICT, message, {
      errorType: ErrorType.BUSINESS,
      errorSource: 'resource',
      metadata
    });
  }
}

/**
 * Error class for database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.DATABASE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'database',
      metadata
    });
  }
}

/**
 * Error class for internal server errors
 */
export class InternalError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'system',
      metadata
    });
  }
}

/**
 * Error class for rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'rate-limit',
      metadata
    });
  }
}

/**
 * Error class for external service errors
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'external-service',
      metadata
    });
  }
}

/**
 * Error class for payment errors
 */
export class PaymentError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.PAYMENT_ERROR, message, {
      errorType: ErrorType.BUSINESS,
      errorSource: 'payment',
      metadata
    });
  }
}

/**
 * Error class for delivery errors
 */
export class DeliveryError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.DELIVERY_ERROR, message, {
      errorType: ErrorType.BUSINESS,
      errorSource: 'delivery',
      metadata
    });
  }
}

/**
 * Error class for configuration errors
 */
export class ConfigurationError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.CONFIGURATION_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'configuration',
      metadata
    });
  }
}

/**
 * Error class for network errors
 */
export class NetworkError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.NETWORK_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'network',
      metadata
    });
  }
}

/**
 * Error class for timeout errors
 */
export class TimeoutError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.TIMEOUT_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'timeout',
      metadata
    });
  }
}

/**
 * Error class for cache errors
 */
export class CacheError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.CACHE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'cache',
      metadata
    });
  }
}

/**
 * Error class for queue errors
 */
export class QueueError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.QUEUE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'queue',
      metadata
    });
  }
}

/**
 * Error class for notification errors
 */
export class NotificationError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.NOTIFICATION_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'notification',
      metadata
    });
  }
}

/**
 * Error class for file errors
 */
export class FileError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.FILE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'file',
      metadata
    });
  }
}

/**
 * Error class for security errors
 */
export class SecurityError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.SECURITY_ERROR, message, {
      errorType: ErrorType.SECURITY,
      errorSource: 'security',
      metadata
    });
  }
}

/**
 * Error class for compliance errors
 */
export class ComplianceError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.COMPLIANCE_ERROR, message, {
      errorType: ErrorType.SECURITY,
      errorSource: 'compliance',
      metadata
    });
  }
}

/**
 * Error class for fraud errors
 */
export class FraudError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.FRAUD_ERROR, message, {
      errorType: ErrorType.SECURITY,
      errorSource: 'fraud',
      metadata
    });
  }
}

/**
 * Error class for verification errors
 */
export class VerificationError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.VERIFICATION_ERROR, message, {
      errorType: ErrorType.SECURITY,
      errorSource: 'verification',
      metadata
    });
  }
}

/**
 * Error class for maintenance errors
 */
export class MaintenanceError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.MAINTENANCE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'maintenance',
      metadata
    });
  }
}

/**
 * Error class for upgrade errors
 */
export class UpgradeError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.UPGRADE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'upgrade',
      metadata
    });
  }
}

/**
 * Error class for backup errors
 */
export class BackupError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.BACKUP_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'backup',
      metadata
    });
  }
}

/**
 * Error class for restore errors
 */
export class RestoreError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.RESTORE_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'restore',
      metadata
    });
  }
}

/**
 * Error class for audit errors
 */
export class AuditError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.AUDIT_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'audit',
      metadata
    });
  }
}

/**
 * Error class for monitoring errors
 */
export class MonitoringError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.MONITORING_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'monitoring',
      metadata
    });
  }
}

/**
 * Error class for logging errors
 */
export class LoggingError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.LOGGING_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'logging',
      metadata
    });
  }
}

/**
 * Error class for metrics errors
 */
export class MetricsError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.METRICS_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'metrics',
      metadata
    });
  }
}

/**
 * Error class for alert errors
 */
export class AlertError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.ALERT_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'alert',
      metadata
    });
  }
}

/**
 * Error class for report errors
 */
export class ReportError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.REPORT_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'report',
      metadata
    });
  }
}

/**
 * Error class for analytics errors
 */
export class AnalyticsError extends AppError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(ErrorCode.ANALYTICS_ERROR, message, {
      errorType: ErrorType.TECHNICAL,
      errorSource: 'analytics',
      metadata
    });
  }
} 