/**
 * Enum representing the possible error types in the application
 */
export enum ErrorType {
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  SECURITY = 'security',
  VALIDATION = 'validation'
}

/**
 * Interface representing error metadata
 */
export interface ErrorMetadata {
  /** The type of error */
  errorType: ErrorType;
  /** When the error occurred */
  timestamp?: Date;
  /** The severity of the error */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** Additional error details */
  [key: string]: unknown;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Enum representing the possible error codes in the application
 */
export enum ErrorCode {
  // HTTP Status Codes
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,

  // Validation errors
  VALIDATION_ERROR = 4001,
  INVALID_INPUT = 4002,
  MISSING_REQUIRED_FIELD = 4003,
  INVALID_FORMAT = 4004,
  INVALID_LENGTH = 4005,
  INVALID_VALUE = 4006,
  INVALID_STATUS = 4007,
  INVALID_CREDENTIALS = 4008,
  INVALID_TOKEN = 4009,
  TOKEN_EXPIRED = 4010,
  RESOURCE_NOT_FOUND = 4011,

  // Authentication errors
  AUTHENTICATION_ERROR = 4012,
  AUTHORIZATION_ERROR = 4013,

  // Resource errors
  CONFLICT = 4014,
  DUPLICATE_RESOURCE = 4015,

  // Business errors
  ORDER_ERROR = 4016,
  USER_ERROR = 4017,
  STORE_ERROR = 4018,
  DRIVER_ERROR = 4019,
  PRODUCT_ERROR = 4020,
  CART_ERROR = 4021,
  ADDRESS_ERROR = 4022,
  REVIEW_ERROR = 4023,
  BILLING_ERROR = 4024,
  INVOICE_ERROR = 4025,
  PAYOUT_ERROR = 4026,
  REFUND_ERROR = 4027,
  TAX_ERROR = 4028,
  CURRENCY_ERROR = 4029,
  EXCHANGE_ERROR = 4030,
  WALLET_ERROR = 4031,
  TRANSACTION_ERROR = 4032,
  BALANCE_ERROR = 4033,
  CREDIT_ERROR = 4034,
  DEBIT_ERROR = 4035,

  // Technical errors
  DATABASE_ERROR = 5001,
  NETWORK_ERROR = 5002,
  EXTERNAL_SERVICE_ERROR = 5003,
  CACHE_ERROR = 5004,
  QUEUE_ERROR = 5005,
  CONFIGURATION_ERROR = 5006,
  TIMEOUT_ERROR = 5007,
  RATE_LIMIT_EXCEEDED = 5008,
  PAYMENT_ERROR = 5009,
  DELIVERY_ERROR = 5010,
  NOTIFICATION_ERROR = 5011,
  FILE_ERROR = 5012,
  SECURITY_ERROR = 5013,
  COMPLIANCE_ERROR = 5014,
  FRAUD_ERROR = 5015,
  VERIFICATION_ERROR = 5016,
  MAINTENANCE_ERROR = 5017,
  UPGRADE_ERROR = 5018,
  BACKUP_ERROR = 5019,
  RESTORE_ERROR = 5020,
  AUDIT_ERROR = 5021,
  MONITORING_ERROR = 5022,
  LOGGING_ERROR = 5023,
  METRICS_ERROR = 5024,
  ALERT_ERROR = 5025,
  REPORT_ERROR = 5026,
  ANALYTICS_ERROR = 5027,
  EMAIL_ERROR = 5028,
  SMS_ERROR = 5029,
  PUSH_ERROR = 5030,
  WEBHOOK_ERROR = 5031,
  API_ERROR = 5032,
  MIGRATION_ERROR = 5033,
  DEPLOYMENT_ERROR = 5034,
  ROLLBACK_ERROR = 5035,
  THIRD_PARTY_ERROR = 5036,
  INTEGRATION_ERROR = 5037,
} 