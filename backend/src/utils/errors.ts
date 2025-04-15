export enum ErrorCode {
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  BAD_REQUEST = 'BAD_REQUEST'
}

export type ErrorType = 'technical' | 'business' | 'compliance';
export type ErrorSource = 'client' | 'server' | 'network' | 'database';

export interface ErrorOptions {
  statusCode?: number;
  metadata?: Record<string, any>;
  errorType?: ErrorType;
  errorSource?: ErrorSource;
  context?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, any>;
  public readonly errorType: ErrorType;
  public readonly errorSource: ErrorSource;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    codeOrStatusCode: ErrorCode | number,
    options: ErrorOptions = {}
  ) {
    super(message);
    this.name = 'AppError';

    // Handle both ErrorCode and numeric status code
    if (typeof codeOrStatusCode === 'number') {
      this.statusCode = codeOrStatusCode;
      this.code = this.getErrorCodeFromStatusCode(codeOrStatusCode);
    } else {
      this.code = codeOrStatusCode;
      this.statusCode = options.statusCode || this.getDefaultStatusCode(codeOrStatusCode);
    }

    this.metadata = options.metadata;
    this.errorType = options.errorType || this.getDefaultErrorType(this.code);
    this.errorSource = options.errorSource || this.getDefaultErrorSource(this.code);
    this.context = options.context;

    // Ensure proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultStatusCode(code: ErrorCode): number {
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.BAD_REQUEST:
        return 400;
      case ErrorCode.AUTHENTICATION_ERROR:
        return 401;
      case ErrorCode.AUTHORIZATION_ERROR:
        return 403;
      case ErrorCode.NOT_FOUND:
        return 404;
      case ErrorCode.RATE_LIMIT_ERROR:
        return 429;
      case ErrorCode.CONFIGURATION_ERROR:
      case ErrorCode.INTERNAL_SERVER_ERROR:
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.NETWORK_ERROR:
      default:
        return 500;
    }
  }

  private getErrorCodeFromStatusCode(statusCode: number): ErrorCode {
    switch (statusCode) {
      case 400:
        return ErrorCode.BAD_REQUEST;
      case 401:
        return ErrorCode.AUTHENTICATION_ERROR;
      case 403:
        return ErrorCode.AUTHORIZATION_ERROR;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 429:
        return ErrorCode.RATE_LIMIT_ERROR;
      case 500:
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  private getDefaultErrorType(code: ErrorCode): ErrorType {
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.BAD_REQUEST:
      case ErrorCode.AUTHENTICATION_ERROR:
      case ErrorCode.AUTHORIZATION_ERROR:
      case ErrorCode.NOT_FOUND:
      case ErrorCode.RATE_LIMIT_ERROR:
        return 'business';
      case ErrorCode.CONFIGURATION_ERROR:
      case ErrorCode.INTERNAL_SERVER_ERROR:
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.NETWORK_ERROR:
      default:
        return 'technical';
    }
  }

  private getDefaultErrorSource(code: ErrorCode): ErrorSource {
    switch (code) {
      case ErrorCode.DATABASE_ERROR:
        return 'database';
      case ErrorCode.NETWORK_ERROR:
        return 'network';
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.BAD_REQUEST:
      case ErrorCode.AUTHENTICATION_ERROR:
      case ErrorCode.AUTHORIZATION_ERROR:
      case ErrorCode.NOT_FOUND:
      case ErrorCode.RATE_LIMIT_ERROR:
        return 'client';
      case ErrorCode.CONFIGURATION_ERROR:
      case ErrorCode.INTERNAL_SERVER_ERROR:
      default:
        return 'server';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      errorType: this.errorType,
      errorSource: this.errorSource,
      metadata: this.metadata,
      context: this.context
    };
  }
} 