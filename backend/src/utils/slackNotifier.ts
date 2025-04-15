import axios from 'axios';
import { AppError, ErrorType } from './AppError';
import { createLogger } from './logger';

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username?: string;
  iconEmoji?: string;
}

class SlackNotifier {
  private config: SlackConfig;
  private logger = createLogger({ module: 'SlackNotifier' });

  constructor(config: SlackConfig) {
    this.config = config;
  }

  private formatErrorBlock(error: AppError) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error Type:* ${error.errorType || 'UNKNOWN'}\n*Status Code:* ${error.statusCode}\n*Message:* ${error.message}`
        }
      }
    ];

    if (error.metadata) {
      const metadataText = Object.entries(error.metadata)
        .map(([key, value]) => `*${key}:* ${value}`)
        .join('\n');
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: metadataText
        }
      });
    }

    return blocks;
  }

  async notifyError(error: AppError) {
    try {
      // Only notify for certain error types or severity levels
      if (!this.shouldNotify(error)) {
        return;
      }

      const payload = {
        channel: this.config.channel,
        username: this.config.username || 'Error Bot',
        icon_emoji: this.config.iconEmoji || ':warning:',
        blocks: this.formatErrorBlock(error)
      };

      await axios.post(this.config.webhookUrl, payload);
      this.logger.info('Error notification sent to Slack', { errorType: error.errorType });
    } catch (err) {
      this.logger.error('Failed to send Slack notification', err as Error);
    }
  }

  private shouldNotify(error: AppError): boolean {
    // Define which error types should trigger notifications
    const notifyTypes = [
      ErrorType.SYSTEM,
      ErrorType.SECURITY,
      ErrorType.DATABASE,
      ErrorType.AUTH
    ];

    // Check if error type should be notified
    if (error.errorType && notifyTypes.includes(error.errorType)) {
      return true;
    }

    // Check severity level
    if (error.metadata?.severity === 'critical') {
      return true;
    }

    return false;
  }
}

// Create and export a singleton instance
const slackNotifier = new SlackNotifier({
  webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  channel: process.env.SLACK_ERROR_CHANNEL || '#errors',
  username: 'Error Monitor',
  iconEmoji: ':warning:'
});

export default slackNotifier; 