import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { ValidationError } from '../utils/errorHandler';

interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      throw new ValidationError('Request validation failed', {
        context: { error },
        fingerprint: ['validation', 'request', 'schema']
      });
    }
  };
}; 