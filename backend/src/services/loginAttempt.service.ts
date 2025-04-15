import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { config } from '../config/config';
import { RedisClient } from '../utils/redis';

interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

export class LoginAttemptService {
  private static instance: LoginAttemptService;
  private redis: RedisClient;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour

  private constructor() {
    this.redis = RedisClient.getInstance();
  }

  public static getInstance(): LoginAttemptService {
    if (!LoginAttemptService.instance) {
      LoginAttemptService.instance = new LoginAttemptService();
    }
    return LoginAttemptService.instance;
  }

  private getKey(email: string): string {
    return `login_attempts:${email}`;
  }

  public async trackFailedAttempt(email: string): Promise<LoginAttempt> {
    const key = this.getKey(email);
    const now = new Date();
    
    try {
      const attempts = await this.redis.get<LoginAttempt>(key) || {
        count: 0,
        lastAttempt: now
      };

      attempts.count++;
      attempts.lastAttempt = now;

      if (attempts.count >= this.MAX_ATTEMPTS) {
        attempts.lockedUntil = new Date(now.getTime() + this.LOCKOUT_DURATION);
      }

      await this.redis.set(key, attempts, this.ATTEMPT_WINDOW);
      return attempts;
    } catch (error) {
      logger.error('Error tracking login attempt:', error);
      throw new AppError('Failed to track login attempt', 500);
    }
  }

  public async resetAttempts(email: string): Promise<void> {
    const key = this.getKey(email);
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Error resetting login attempts:', error);
      throw new AppError('Failed to reset login attempts', 500);
    }
  }

  public async getAttempts(email: string): Promise<LoginAttempt> {
    const key = this.getKey(email);
    try {
      const attempts = await this.redis.get<LoginAttempt>(key);
      return attempts || { count: 0, lastAttempt: new Date() };
    } catch (error) {
      logger.error('Error getting login attempts:', error);
      throw new AppError('Failed to get login attempts', 500);
    }
  }

  public async isAccountLocked(email: string): Promise<boolean> {
    const attempts = await this.getAttempts(email);
    if (!attempts.lockedUntil) return false;
    
    const now = new Date();
    if (now > attempts.lockedUntil) {
      await this.resetAttempts(email);
      return false;
    }
    
    return true;
  }

  public async getLockoutTimeRemaining(email: string): Promise<number> {
    const attempts = await this.getAttempts(email);
    if (!attempts.lockedUntil) return 0;
    
    const now = new Date();
    const remaining = attempts.lockedUntil.getTime() - now.getTime();
    return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds remaining
  }
} 