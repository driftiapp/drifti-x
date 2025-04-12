import { subDays, startOfDay, endOfDay, format, addDays } from 'date-fns';
import { AdminLoginLog } from '../models/security.model';
import { LoginStatus } from '../types/security';
import { logger } from '../utils/logger';

interface ISecurityDashboardData {
  heatmap: Array<{
    hour: number;
    day: number;
    count: number;
  }>;
  riskScore: number;
  recommendations: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  trends: Array<{
    date: string;
    success: number;
    failed: number;
  }>;
}

export class SecurityService {
  async getSecurityDashboardData(days: number): Promise<ISecurityDashboardData> {
    const now = new Date();
    const startDate = subDays(now, days);

    // Get login heatmap
    const heatmap = await this.getLoginHeatmap(startDate, now);

    // Get risk score
    const riskScore = await this.calculateRiskScore(startDate, now);

    // Get recommendations
    const recommendations = await this.generateRecommendations(startDate, now);

    // Get trends
    const trends = await this.getLoginTrends(startDate, now);

    return {
      heatmap,
      riskScore,
      recommendations,
      trends
    };
  }

  private async getLoginHeatmap(startDate: Date, endDate: Date): Promise<Array<{
    hour: number;
    day: number;
    count: number;
  }>> {
    const startTime = performance.now();
    const heatmap = await AdminLoginLog.aggregate([
      {
        $match: {
          loginTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$loginTime' },
            day: { $dayOfWeek: '$loginTime' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id.hour',
          day: '$_id.day',
          count: 1
        }
      }
    ]);

    logger.debug('Login heatmap generated', {
      duration: performance.now() - startTime,
      entries: heatmap.length
    });

    return heatmap;
  }

  private async calculateRiskScore(startDate: Date, endDate: Date): Promise<number> {
    const startTime = performance.now();

    // Get failed login attempts
    const failedAttempts = await AdminLoginLog.countDocuments({
      status: LoginStatus.FAILED,
      loginTime: { $gte: startDate, $lte: endDate }
    });

    // Get total login attempts
    const totalAttempts = await AdminLoginLog.countDocuments({
      loginTime: { $gte: startDate, $lte: endDate }
    });

    // Calculate risk score (0-100)
    // Higher score means higher risk
    const failureRate = totalAttempts > 0 ? (failedAttempts / totalAttempts) : 0;
    const riskScore = Math.min(Math.round(failureRate * 100 * 2), 100);

    logger.debug('Risk score calculated', {
      duration: performance.now() - startTime,
      failedAttempts,
      totalAttempts,
      riskScore
    });

    return riskScore;
  }

  private async generateRecommendations(startDate: Date, endDate: Date): Promise<Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>> {
    const startTime = performance.now();
    const recommendations: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Check failed login attempts
    const failedAttempts = await AdminLoginLog.countDocuments({
      status: LoginStatus.FAILED,
      loginTime: { $gte: startDate, $lte: endDate }
    });

    if (failedAttempts > 100) {
      recommendations.push({
        type: 'failed_logins',
        message: 'High number of failed login attempts detected. Consider implementing additional security measures.',
        severity: 'high'
      });
    } else if (failedAttempts > 50) {
      recommendations.push({
        type: 'failed_logins',
        message: 'Moderate number of failed login attempts detected. Monitor the situation closely.',
        severity: 'medium'
      });
    }

    // Check for suspicious IP addresses
    const suspiciousIPs = await AdminLoginLog.aggregate([
      {
        $match: {
          status: LoginStatus.FAILED,
          loginTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 10 }
        }
      }
    ]);

    if (suspiciousIPs.length > 0) {
      recommendations.push({
        type: 'suspicious_ips',
        message: `${suspiciousIPs.length} IP addresses show suspicious activity. Consider blocking these IPs.`,
        severity: 'high'
      });
    }

    logger.debug('Security recommendations generated', {
      duration: performance.now() - startTime,
      count: recommendations.length
    });

    return recommendations;
  }

  private async getLoginTrends(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    success: number;
    failed: number;
  }>> {
    const startTime = performance.now();
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

    logger.debug('Login trends generated', {
      duration: performance.now() - startTime,
      days: trends.length
    });

    return trends;
  }
} 