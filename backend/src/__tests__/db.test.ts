import mongoose from 'mongoose';
import { connectDB } from '../db';
import { logger } from '../utils/logger';

jest.mock('mongoose');
jest.mock('../utils/logger');

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to MongoDB successfully', async () => {
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(expect.any(String));
    expect(logger.info).toHaveBeenCalledWith('MongoDB connected successfully');
  });

  it('should handle connection errors', async () => {
    const error = new Error('Connection failed');
    (mongoose.connect as jest.Mock).mockRejectedValue(error);

    await expect(connectDB()).rejects.toThrow('Connection failed');
    expect(logger.error).toHaveBeenCalledWith('MongoDB connection error:', error);
  });

  it('should use the correct MongoDB URI', async () => {
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      expect.stringContaining('mongodb://')
    );
  });
}); 