import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import axios from 'axios';

interface ServiceStatus {
  healthy: boolean;
  error?: string;
  timestamp: string;
}

interface EndpointStatus {
  path: string;
  healthy: boolean;
  error?: string;
  responseTime?: number;
}

export class HealthCheckService {
  private prisma: PrismaClient;
  private baseUrl: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.baseUrl = `http://localhost:${config.port}`;
  }

  async checkAllServices(): Promise<Record<string, ServiceStatus>> {
    const services: Record<string, ServiceStatus> = {};

    // Check database
    services.database = await this.checkDatabase();

    // Check email service
    services.email = await this.checkEmailService();

    // Check IPInfo service
    services.ipinfo = await this.checkIPInfoService();

    // Check Slack service if configured
    if (config.slack?.botToken) {
      services.slack = await this.checkSlackService();
    }

    return services;
  }

  async checkAllEndpoints(): Promise<EndpointStatus[]> {
    const endpoints = [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/users/me',
      '/api/admin/users',
      '/api/admin/activity'
    ];

    const results: EndpointStatus[] = [];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.baseUrl}${endpoint}`);
        const responseTime = Date.now() - startTime;

        results.push({
          path: endpoint,
          healthy: response.status === 200,
          responseTime
        });
      } catch (error) {
        results.push({
          path: endpoint,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        healthy: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkEmailService(): Promise<ServiceStatus> {
    try {
      // Test email configuration
      if (!config.email.host || !config.email.port || !config.email.user || !config.email.pass) {
        throw new Error('Email configuration is incomplete');
      }

      return {
        healthy: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Email service check failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkIPInfoService(): Promise<ServiceStatus> {
    try {
      if (!config.ipinfo.token) {
        throw new Error('IPInfo token is not configured');
      }

      return {
        healthy: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'IPInfo service check failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkSlackService(): Promise<ServiceStatus> {
    try {
      if (!config.slack?.botToken) {
        throw new Error('Slack bot token is not configured');
      }

      return {
        healthy: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Slack service check failed',
        timestamp: new Date().toISOString()
      };
    }
  }
} 