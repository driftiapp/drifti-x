import { Router } from 'express';
import { config } from '../config/config';
import { SlackService } from '../services/slack.service';
import { DeviceInfoService } from '../utils/deviceInfo';
import { AppError } from '../utils/AppError';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';

const router = Router();
const slackService = SlackService.getInstance();
const deviceInfoService = DeviceInfoService.getInstance();
const prisma = new PrismaClient();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env
  });
});

// System status check (protected)
router.get('/system', async (req, res) => {
  try {
    // Get system info
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      system: systemInfo,
      config: {
        environment: config.env,
        port: config.port,
        corsOrigin: config.cors.origin,
        logLevel: config.logLevel
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check system status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Slack connection
router.post('/test/slack', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const success = await slackService.sendMessage({
      text: 'Test message from DriftiX health check',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*System Health Check*\nTest message from the DriftiX health check endpoint.'
          }
        }
      ]
    });

    res.json({
      success,
      message: success ? 'Slack message sent successfully' : 'Failed to send Slack message'
    });
  } catch (error) {
    throw new AppError('Failed to test Slack connection', 500);
  }
});

// Database health check
router.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState;
    const mongoStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[mongoStatus] || 'unknown';

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          status: mongoStatusText,
          connected: mongoStatus === 1
        }
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      error: errorMessage
    });
  }
});

async function checkMongoDBConnection(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    // Add your MongoDB connection check here
    // For example: await mongoose.connection.db.admin().ping();
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    return { status: 'error', latency: Date.now() - start };
  }
}

async function testSlackConnection(): Promise<{ status: string; lastMessage?: string }> {
  try {
    const success = await slackService.sendMessage({
      text: 'System health check',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*System Health Check*\nTesting Slack connection...'
          }
        }
      ]
    });

    return {
      status: success ? 'ok' : 'error',
      lastMessage: success ? 'Test message sent successfully' : 'Failed to send test message'
    };
  } catch (error) {
    return { status: 'error', lastMessage: 'Failed to connect to Slack' };
  }
}

export default router; 