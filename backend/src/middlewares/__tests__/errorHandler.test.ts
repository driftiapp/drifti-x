import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';
import { logger } from '../../utils/logger';
import { setTestEnv, restoreEnv } from '../../test/setup';

jest.mock('../../utils/logger');

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    setTestEnv({ NODE_ENV: 'development' });
  });

  afterEach(() => {
    jest.clearAllMocks();
    restoreEnv();
  });

  it('should handle AppError correctly', () => {
    const error = new AppError(400, 'Bad Request');
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Bad Request',
      stack: expect.any(String)
    });
  });

  it('should handle mongoose validation errors', () => {
    const error = new Error('Validation Error');
    error.name = 'ValidationError';
    (error as any).errors = { field: { message: 'Invalid field' } };

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Validation Error',
      errors: { field: { message: 'Invalid field' } },
      stack: expect.any(String)
    });
  });

  it('should handle mongoose duplicate key errors', () => {
    const error = new Error('Duplicate key');
    (error as any).code = 11000;

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Duplicate field value entered',
      stack: expect.any(String)
    });
  });

  it('should handle unknown errors', () => {
    const error = new Error('Unknown error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Something went wrong',
      stack: expect.any(String)
    });
  });

  it('should not include stack trace in production', () => {
    setTestEnv({ NODE_ENV: 'production' });
    const error = new Error('Test error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Something went wrong'
    });
  });
}); 