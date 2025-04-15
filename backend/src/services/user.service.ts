import { UserModel } from '../models/user.model';
import { IUser, IUserDocument } from '../types/user';
import { AppError, ErrorCode } from '../utils/AppError';
import { logger } from '../utils/logger';
import { sendPasswordResetEmail } from '../utils/email';
import { ActivityLogService } from './activityLog.service';

interface GetUsersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

interface UpdateUserOptions {
  role?: string;
  status?: 'active' | 'inactive';
}

export class UserService {
  private static instance: UserService;
  private userModel: typeof UserModel;
  private activityLogService: ActivityLogService;

  private constructor() {
    this.userModel = UserModel;
    this.activityLogService = new ActivityLogService();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  public async getUsers(
    page: number = 1,
    limit: number = 10,
    filters: Partial<IUser> = {}
  ): Promise<{ users: IUserDocument[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const users = await this.userModel
        .find(filters)
        .skip(skip)
        .limit(limit)
        .exec();
      const total = await this.userModel.countDocuments(filters);
      return { users, total };
    } catch (error) {
      logger.error('Failed to fetch users', { error });
      throw new AppError('Failed to fetch users', ErrorCode.INTERNAL_ERROR);
    }
  }

  public async updateUser(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUserDocument> {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );
      if (!user) {
        throw new AppError('User not found', ErrorCode.NOT_FOUND);
      }

      await this.activityLogService.logActivity({
        userId: user._id,
        action: 'update_user',
        details: 'User updated successfully',
        metadata: { email: user.email }
      });

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to update user', { error });
      throw new AppError('Failed to update user', ErrorCode.INTERNAL_ERROR);
    }
  }

  public async resetPassword(
    userId: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new AppError('User not found', ErrorCode.NOT_FOUND);
      }

      user.password = newPassword;
      await user.save();

      await this.activityLogService.logActivity({
        userId: user._id,
        action: 'reset_password',
        details: 'Password reset by admin',
        metadata: { email: user.email }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to reset password', { error });
      throw new AppError('Failed to reset password', ErrorCode.INTERNAL_ERROR);
    }
  }

  async resetUserPassword(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate a password reset token
      const resetToken = await user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      await sendPasswordResetEmail(user.email, resetToken);

      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      logger.error('Error in resetUserPassword service:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to reset password', 500);
    }
  }
} 