import { Logger } from '@nestjs/common';
import { AppError } from './AppError';
import { ErrorCode, ErrorType } from '../types/error';

type Constructor<T = {}> = new (...args: any[]) => T;

interface PerformanceMetrics {
  methodName: string;
  duration: number;
  success: boolean;
  error?: Error;
}

export function withPerformanceLogging(methodName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const end = performance.now();
        logger.log(
          `${methodName} executed in ${(end - start).toFixed(2)}ms`
        );
        return result;
      } catch (error) {
        const end = performance.now();
        logger.error(
          `${methodName} failed after ${(end - start).toFixed(2)}ms: ${
            error.message
          }`
        );
        throw error;
      }
    };

    return descriptor;
  };
} 