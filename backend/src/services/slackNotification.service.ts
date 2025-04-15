import { config } from '../config/app.config';
import { logger } from '../utils/logger';
import { slackQueue } from '../queues/slack.queue';

interface SlackMessage {
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
}

export class SlackNotificationService {
  private static instance: SlackNotificationService;

  private constructor() {}

  public static getInstance(): SlackNotificationService {
    if (!SlackNotificationService.instance) {
      SlackNotificationService.instance = new SlackNotificationService();
    }
    return SlackNotificationService.instance;
  }

  public async sendMessage(message: SlackMessage): Promise<void> {
    if (config.env.isDev) {
      logger.info('Slack notifications disabled in development mode');
      return;
    }

    try {
      await slackQueue.add('message', { message });
      logger.info('Slack message queued successfully');
    } catch (error) {
      logger.error('Failed to queue Slack message:', error);
      throw error;
    }
  }

  public async sendAlert(message: string, details?: Record<string, any>): Promise<void> {
    const slackMessage: SlackMessage = {
      text: `🚨 *Alert*: ${message}`,
      attachments: [
        {
          color: '#ff0000',
          text: details ? JSON.stringify(details, null, 2) : '',
        },
      ],
    };

    await this.sendMessage(slackMessage);
  }
} 