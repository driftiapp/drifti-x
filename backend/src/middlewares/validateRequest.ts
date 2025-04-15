import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Schema for validating different parts of a request
 */
type ValidationSchema = {
  body?: z.ZodType<any, any>;
  query?: z.ZodType<any, any>;
  params?: z.ZodType<any, any>;
};

/**
 * Middleware for validating request data using Zod schemas
 * @param schema Validation schema for request body, query, and params
 * @returns Express middleware function
 */
export const validateRequest = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log validation attempt
      logger.debug('Validating request data', {
        path: req.path,
        method: req.method,
        hasBody: !!req.body,
        hasQuery: !!Object.keys(req.query).length,
        hasParams: !!Object.keys(req.params).length
      });

      // Validate request body if schema provided
      if (schema.body) {
        await schema.body.parseAsync(req.body);
        logger.debug('Request body validation successful');
      }

      // Validate query parameters if schema provided
      if (schema.query) {
        await schema.query.parseAsync(req.query);
        logger.debug('Query parameters validation successful');
      }

      // Validate route parameters if schema provided
      if (schema.params) {
        await schema.params.parseAsync(req.params);
        logger.debug('Route parameters validation successful');
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        // Log validation error
        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors: validationErrors
        });

        // Throw formatted validation error
        throw new AppError('Validation Error', {
          statusCode: 400,
          context: { validationErrors },
          fingerprint: ['validation-error']
        });
      }

      // Pass other errors to error handling middleware
      next(error);
    }
  };
}; 