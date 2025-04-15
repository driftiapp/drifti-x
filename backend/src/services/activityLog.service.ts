import { Injectable } from '@nestjs/common';
import { ActivityLog } from '../models/activityLog.model';
import { DeviceInfoService } from '../utils/deviceInfo';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { withPerformanceLogging } from '../utils/performance';
import { PrismaService } from './prisma.service';
import { ErrorCode } from '../types/error';

export interface GetUserActivitiesParams {
  userId: string;
  page?: number;
  limit?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  private static instance: ActivityLogService;
  private deviceInfoService: DeviceInfoService;

  private constructor() {
    this.deviceInfoService = DeviceInfoService.getInstance();
  }

  public static getInstance(): ActivityLogService {
    if (!ActivityLogService.instance) {
      ActivityLogService.instance = new ActivityLogService();
    }
    return ActivityLogService.instance;
  }

  public async logActivity(
    userId: string,
    action: string,
    details: Record<string, any>,
    req: any
  ): Promise<void> {
    try {
      const ipAddress = this.deviceInfoService.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      const [location, device] = await Promise.all([
        this.deviceInfoService.getLocationInfo(ipAddress),
        this.deviceInfoService.getDeviceInfo(userAgent)
      ]);

      await ActivityLog.create({
        userId,
        action,
        details,
        ipAddress,
        userAgent,
        location,
        device,
        createdAt: new Date()
      });
    } catch (error) {
      logger.error('Error logging activity:', error);
      throw error;
    }
  }

  @withPerformanceLogging('getUserActivities')
  public async getUserActivities(params: GetUserActivitiesParams) {
    try {
      const { userId, page = 1, limit = 10, action, startDate, endDate } = params;
      const skip = (page - 1) * limit;

      const where = {
        userId,
        ...(action && { action }),
        ...(startDate && endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
      };

      const [activities, total] = await Promise.all([
        this.prisma.activityLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.activityLog.count({ where }),
      ]);

      return {
        activities,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw AppError.database('Failed to get user activities', { error });
    }
  }

  @withPerformanceLogging('getRecentActivities')
  public async getRecentActivities(limit = 10) {
    try {
      const activities = await this.prisma.activityLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return activities;
    } catch (error) {
      throw AppError.database('Failed to get recent activities', { error });
    }
  }
} 