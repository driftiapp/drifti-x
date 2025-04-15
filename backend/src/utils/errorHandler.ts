export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const createError = (message: string, status: number = 500, code?: string) => {
  return new AppError(message, status, code);
}; 