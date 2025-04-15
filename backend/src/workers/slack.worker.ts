import { Worker, Job, Queue } from 'bullmq';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';
import axios, { AxiosError } from 'axios';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

interface SlackJobData {
  message: {
    text: string;
    attachments?: Array<{
      color: string;
      text: string;
      fields?: Array<{
        title: string;
        value: string;
        short: boolean;
      }>;
    }>;
  };
  retryCount?: number;
}

// Create Prometheus metrics
const registry = new Registry();
const jobDuration = new Histogram({
  name: 'slack_job_duration_seconds',
  help: 'Duration of Slack jobs in seconds',
  labelNames: ['status'],
  registers: [registry],
});

const jobsCompleted = new Counter({
  name: 'slack_job_completed_total',
  help: 'Total number of completed Slack jobs',
  registers: [registry],
});

const jobsFailed = new Counter({
  name: 'slack_job_failed_total',
  help: 'Total number of failed Slack jobs',
  registers: [registry],
});

const queueSize = new Gauge({
  name: 'slack_queue_size',
  help: 'Current size of the Slack queue',
  registers: [registry],
});

// Get Redis connection details
const redisUrl = config.services.redis?.url;
const redisHost = redisUrl ? new URL(redisUrl).hostname : 'localhost';
const redisPort = redisUrl ? parseInt(new URL(redisUrl).port) : 6379;

// Create queue instance
const queue = new Queue<SlackJobData>('slack', {
  connection: {
    host: redisHost,
    port: redisPort,
  },
});

// Create and export the worker
export const worker = new Worker<SlackJobData>(
  'slack',
  async (job: Job<SlackJobData>) => {
    const { message } = job.data;
    const end = jobDuration.startTimer();
    
    try {
      await axios.post(config.services.slack.webhookUrl, message);
      end({ status: 'success' });
      jobsCompleted.inc();
      logger.info('Slack message sent successfully', { jobId: job.id });
    } catch (error) {
      const axiosError = error as AxiosError;
      end({ status: 'error' });
      jobsFailed.inc();
      
      // Don't retry for client errors (4xx)
      if (axiosError.response && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        logger.error('Slack message failed with client error:', {
          jobId: job.id,
          status: axiosError.response.status,
          data: axiosError.response.data,
        });
        throw error;
      }

      // For server errors (5xx) or network issues, let BullMQ handle retries
      logger.warn('Slack message failed, will retry:', {
        jobId: job.id,
        error: error.message,
        attempt: job.attemptsMade,
      });
      throw error;
    }
  },
  {
    connection: {
      host: redisHost,
      port: redisPort,
    },
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs per second
      duration: 1000,
    },
  }
);

// Update queue size metric
const updateQueueSize = async () => {
  const size = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed');
  queueSize.set(size.waiting + size.active + size.delayed);
};

worker.on('active', updateQueueSize);
worker.on('completed', updateQueueSize);
worker.on('failed', updateQueueSize);

worker.on('error', (error: Error) => {
  logger.error('Slack worker error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing Slack worker...');
  await worker.close();
  await queue.close();
  logger.info('Slack worker closed');
});

// Start the worker
logger.info('Slack worker started', { redisHost, redisPort });

// Export metrics endpoint
export const metrics = async (req: any, res: any) => {
  try {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch (error) {
    logger.error('Failed to serve metrics:', error);
    res.status(500).end();
  }
}; 