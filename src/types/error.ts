import { ErrorCode } from './enums';

export interface ErrorMetadata {
  context?: string;
  path?: string;
  method?: string;
  fingerprint?: string[];
  extra?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    status: number;
    metadata?: ErrorMetadata;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = ErrorResponse | SuccessResponse<T>; 