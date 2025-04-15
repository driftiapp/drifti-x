// Test file for cleanup monitor
// This file will be modified to test the cleanup monitor

import { cleanupLogger } from '../utils/cleanupLogger';
import { createLogger } from '../utils/logger';
import { AppError, ErrorCode, ErrorType } from '../utils/errorHandler';

// Test comment to trigger cleanup
export const testCleanup = () => {
  cleanupLogger.info('Cleanup test triggered');
  return 'Cleanup test successful';
};

// Add some intentional linting issues to test the cleanup
const unusedVariable = 'test'; // This should trigger a linting error 

const logger = createLogger({ module: 'UserController' });

try {
  // Your code here
} catch (error) {
  logger.error('Failed to process request', error);
  throw new AppError('Operation failed', ErrorCode.INTERNAL_ERROR, {
    errorType: ErrorType.SYSTEM,
    severity: 'critical'
  });
}

// For specialized errors:
logAuthError(userId, 'Invalid credentials');
logValidationError('email', 'Invalid email format');
logSystemCrash(error); 