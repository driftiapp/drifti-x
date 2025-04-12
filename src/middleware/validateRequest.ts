import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError, ErrorCode } from '../utils/AppError';

interface ValidateSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (schema: ValidateSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid request data', {
          code: ErrorCode.VALIDATION_ERROR,
          context: { 
            errors: error.errors,
            body: req.body,
            query: req.query,
            params: req.params
          },
          fingerprint: ['validation', 'request']
        }));
      } else {
        next(error);
      }
    }
  };
}; 