import { Queue } from 'bullmq';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';

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

export const slackQueue = new Queue<SlackJobData>('slack', {
  connection: {
    host: config.services.redis?.url ? new URL(config.services.redis.url).hostname : 'localhost',
    port: config.services.redis?.url ? parseInt(new URL(config.services.redis.url).port) : 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1 second
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing Slack queue...');
  await slackQueue.close();
  logger.info('Slack queue closed');
}); 