import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

type ValidationSchema = {
  body?: z.ZodType<any, any>;
  query?: z.ZodType<any, any>;
  params?: z.ZodType<any, any>;
};

export const validateRequest = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        throw new AppError('Validation Error', {
          context: { validationErrors },
          fingerprint: ['validation-error']
        });
      }
      next(error);
    }
  };
}; 