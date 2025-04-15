import { Controller, Get, Query, Param } from '@nestjs/common';
import { ActivityLogService } from '../services/activityLog.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { withPerformanceLogging } from '../utils/performance';
import { IController } from '../types/controller';

@Controller('activity-logs')
export class ActivityLogController implements IController {
  private static instance: ActivityLogController;
  private activityLogService: ActivityLogService;

  private constructor() {
    this.activityLogService = ActivityLogService.getInstance();
  }

  public static getInstance(): ActivityLogController {
    if (!ActivityLogController.instance) {
      ActivityLogController.instance = new ActivityLogController();
    }
    return ActivityLogController.instance;
  }

  @Get('user/:userId')
  public async getUserActivities(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.activityLogService.getUserActivities({
      userId,
      page: page ? parseInt(page.toString(), 10) : 1,
      limit: limit ? parseInt(limit.toString(), 10) : 10,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
  }

  @Get('recent')
  public async getRecentActivities(@Query('limit') limit?: number) {
    return this.activityLogService.getRecentActivities(
      limit ? parseInt(limit.toString(), 10) : undefined
    );
  }

  @withPerformanceLogging('exportUserActivities')
  public async exportUserActivities(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { action, startDate, endDate } = req.query;

      const activities = await this.activityLogService.getUserActivities({
        userId,
        page: 1,
        limit: 1000, // Large limit to get all activities
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user-${userId}-activities.csv`);

      // Convert activities to CSV format
      const csvData = this.convertToCSV(activities.activities);
      res.send(csvData);
    } catch (error) {
      logger.error('Error exporting user activities:', error);
      if (error instanceof AppError) {
        res.status(error.getHttpStatusCode()).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  private convertToCSV(activities: any[]): string {
    const headers = ['Timestamp', 'Action', 'Details', 'IP Address', 'Location', 'Device'];
    const rows = activities.map(activity => [
      new Date(activity.createdAt).toISOString(),
      activity.action,
      JSON.stringify(activity.details),
      activity.ipAddress || 'N/A',
      activity.location ? `${activity.location.city}, ${activity.location.country}` : 'N/A',
      activity.userAgent || 'N/A'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
} 