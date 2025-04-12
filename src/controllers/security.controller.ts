import { Request, Response } from 'express';
import { subDays, startOfDay, endOfDay, format, addDays } from 'date-fns';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { SecurityAlert, AdminLoginLog } from '../models/security.model';
import { 
  SecurityAlertType, 
  SecurityAlertSeverity, 
  SecurityAlertStatus,
  LoginStatus,
  AdminRole
} from '../types/security';
import { DatabaseError, ValidationError } from '../utils/errorHandler';
import { SecurityService } from '../services/security.service';
import { performance } from 'perf_hooks';

// Define the login log interface
interface ILoginLog {
  email: string;
  role: string;
  status: string;
  loginTime: Date;
  ipAddress: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  userAgent?: string;
  failureReason?: string;
}

const loginQuerySchema = z.object({
  role: z.nativeEnum(AdminRole).optional(),
  status: z.nativeEnum(LoginStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().min(1).max(100).optional(),
  userId: z.string().min(24).max(24).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

interface ILoginQuery extends z.infer<typeof loginQuerySchema> {}

export class SecurityController {
  private securityService!: SecurityService;
  private static instance: SecurityController;
  private readonly csvParser: Parser<ILoginLog>;
  private readonly pdfDoc: typeof PDFDocument;

  private constructor() {
    this.csvParser = new Parser<ILoginLog>();
    this.pdfDoc = PDFDocument;
  }

  public static getInstance(): SecurityController {
    if (!SecurityController.instance) {
      SecurityController.instance = new SecurityController();
      SecurityController.instance.securityService = new SecurityService();
    }
    return SecurityController.instance;
  }

  async getSecurityOverview(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7);

      // Get recent logins with performance logging
      const recentLogins = await AdminLoginLog.find()
        .sort({ loginTime: -1 })
        .limit(10);
      logger.debug('Recent logins fetched', {
        count: recentLogins.length,
        duration: performance.now() - startTime
      });

      // Get suspicious activity
      const suspiciousActivity = await AdminLoginLog.find({
        status: LoginStatus.FAILED,
        loginTime: { $gte: sevenDaysAgo }
      })
        .sort({ loginTime: -1 })
        .limit(5);

      // Get failed attempts count
      const failedAttempts = await AdminLoginLog.countDocuments({
        status: LoginStatus.FAILED,
        loginTime: { $gte: sevenDaysAgo }
      });

      // Get login trends
      const loginTrends = await this.getLoginTrends(sevenDaysAgo, now);

      const overview = {
        totalLogins: recentLogins.length,
        failedLogins: failedAttempts,
        activeUsers: 50, // Assuming a default activeUsers value
        loginTrends,
        suspiciousActivity: suspiciousActivity.map(attempt => ({
          _id: attempt._id,
          message: `Failed login attempt from ${attempt.ipAddress} (${attempt.location?.country || 'Unknown'})`,
          timestamp: attempt.loginTime
        })),
      };

      res.json({
        success: true,
        data: overview,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching security overview', {
        error,
        context: { userId: req.user?._id }
      });
      throw new DatabaseError('Failed to fetch security overview', {
        context: { error },
        fingerprint: ['security', 'overview', 'fetch-failed']
      });
    } finally {
      const endTime = performance.now();
      logger.info('Security overview fetch completed', {
        duration: endTime - startTime,
        context: { userId: req.user?._id }
      });
    }
  }

  private async getLoginTrends(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    success: number;
    failed: number;
  }>> {
    const trends = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const dayStats = await AdminLoginLog.aggregate([
        {
          $match: {
            loginTime: { $gte: dayStart, $lte: dayEnd }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const successCount = dayStats.find(stat => stat._id === LoginStatus.SUCCESS)?.count || 0;
      const failedCount = dayStats.find(stat => stat._id === LoginStatus.FAILED)?.count || 0;

      trends.push({
        date: format(currentDate, 'MMM dd'),
        success: successCount,
        failed: failedCount
      });

      currentDate = addDays(currentDate, 1);
    }

    return trends;
  }

  async getLoginLogs(req: Request<{}, {}, {}, ILoginQuery>, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const query = loginQuerySchema.parse(req.query);
      
      const logs = await AdminLoginLog.find(query)
        .sort({ loginTime: -1 })
        .limit(1000);

      logger.debug('Login logs fetched', {
        count: logs.length,
        duration: performance.now() - startTime,
        query
      });

      res.json({
        success: true,
        data: logs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', {
          context: { error: error.errors },
          fingerprint: ['security', 'logs', 'invalid-query']
        });
      }
      logger.error('Error fetching login logs', {
        error,
        context: { userId: req.user?._id }
      });
      throw new DatabaseError('Failed to fetch login logs', {
        context: { error },
        fingerprint: ['security', 'logs', 'fetch-failed']
      });
    } finally {
      const endTime = performance.now();
      logger.info('Login logs fetch completed', {
        duration: endTime - startTime,
        context: { userId: req.user?._id }
      });
    }
  }

  async exportToCSV(req: Request<{}, {}, {}, ILoginQuery>, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const query = loginQuerySchema.parse(req.query);
      
      const logs = await AdminLoginLog.find(query)
        .sort({ loginTime: -1 })
        .limit(1000);
      
      const csv = this.csvParser.parse(logs);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=login-logs.csv');
      res.send(csv);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', {
          context: { error: error.errors },
          fingerprint: ['security', 'export', 'invalid-query']
        });
      }
      logger.error('Error exporting to CSV', {
        error,
        context: { userId: req.user?._id }
      });
      throw new DatabaseError('Failed to export login logs', {
        context: { error },
        fingerprint: ['security', 'export', 'csv-failed']
      });
    } finally {
      const endTime = performance.now();
      logger.info('CSV export completed', {
        duration: endTime - startTime,
        context: { userId: req.user?._id }
      });
    }
  }

  async exportToPDF(req: Request<{}, {}, {}, ILoginQuery>, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const query = loginQuerySchema.parse(req.query);
      
      const logs = await AdminLoginLog.find(query)
        .sort({ loginTime: -1 })
        .limit(1000);
      
      const doc = new this.pdfDoc();
      const filename = 'login-logs.pdf';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      doc.pipe(res);

      // Add title
      doc.fontSize(20).text('Login Activity Report', { align: 'center' });
      doc.moveDown();

      // Add each log entry
      logs.forEach(log => {
        doc.fontSize(12).text(`Email: ${log.email}`);
        doc.fontSize(10).text(`Role: ${log.role}`);
        doc.text(`Status: ${log.status}`);
        doc.text(`Time: ${new Date(log.loginTime).toLocaleString()}`);
        doc.text(`IP: ${log.ipAddress}`);
        doc.text(`Location: ${log.location?.country || 'Unknown'}`);
        if (log.failureReason) {
          doc.text(`Failure Reason: ${log.failureReason}`);
        }
        doc.moveDown();
      });

      doc.end();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', {
          context: { error: error.errors },
          fingerprint: ['security', 'export', 'invalid-query']
        });
      }
      logger.error('Error exporting to PDF', {
        error,
        context: { userId: req.user?._id }
      });
      throw new DatabaseError('Failed to export login logs', {
        context: { error },
        fingerprint: ['security', 'export', 'pdf-failed']
      });
    } finally {
      const endTime = performance.now();
      logger.info('PDF export completed', {
        duration: endTime - startTime,
        context: { userId: req.user?._id }
      });
    }
  }

  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await this.securityService.getSecurityDashboardData(days);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting security dashboard data', {
        error,
        context: { userId: req.user?._id, days: req.query.days }
      });
      throw new DatabaseError('Failed to get security dashboard data', {
        context: { error },
        fingerprint: ['security', 'dashboard', 'fetch-failed']
      });
    }
  }

  async getLoginHeatmap(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await this.securityService.getSecurityDashboardData(days);
      res.json({
        success: true,
        data: data.heatmap,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting login heatmap', {
        error,
        context: { userId: req.user?._id, days: req.query.days }
      });
      throw new DatabaseError('Failed to get login heatmap', {
        context: { error },
        fingerprint: ['security', 'heatmap', 'fetch-failed']
      });
    }
  }

  async getRiskScore(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await this.securityService.getSecurityDashboardData(days);
      res.json({
        success: true,
        data: { riskScore: data.riskScore },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting risk score', {
        error,
        context: { userId: req.user?._id, days: req.query.days }
      });
      throw new DatabaseError('Failed to get risk score', {
        context: { error },
        fingerprint: ['security', 'risk-score', 'fetch-failed']
      });
    }
  }

  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await this.securityService.getSecurityDashboardData(days);
      res.json({
        success: true,
        data: data.recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting recommendations', {
        error,
        context: { userId: req.user?._id, days: req.query.days }
      });
      throw new DatabaseError('Failed to get recommendations', {
        context: { error },
        fingerprint: ['security', 'recommendations', 'fetch-failed']
      });
    }
  }
} 