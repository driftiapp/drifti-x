import { WebClient } from '@slack/web-api';
import { cleanupLogger } from './cleanupLogger';
import { config } from '../config/config';

export class MonitorCrashHandler {
  private readonly slackClient: WebClient;
  private readonly channel = '#driftix-alerts';
  private readonly maxRetries = 3;
  private retryCount = 0;

  constructor() {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    process.on('uncaughtException', (error) => {
      this.handleCrash('Uncaught Exception', error);
    });

    process.on('unhandledRejection', (reason) => {
      this.handleCrash('Unhandled Rejection', reason);
    });
  }

  private async handleCrash(type: string, error: any) {
    try {
      cleanupLogger.error(`Monitor crash: ${type}`, { error });

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await this.sendSlackAlert(type, error);
        this.scheduleRestart();
      } else {
        await this.sendSlackAlert(type, error, true);
        process.exit(1);
      }
    } catch (slackError) {
      cleanupLogger.error('Failed to send Slack alert:', { error: slackError });
      process.exit(1);
    }
  }

  private async sendSlackAlert(type: string, error: any, isFinal = false) {
    const message = {
      channel: this.channel,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ *Cleanup Monitor Crash*\nType: ${type}\nAttempt: ${this.retryCount + 1}/${this.maxRetries}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error:*\n\`\`\`${error.stack || error.message || error}\`\`\``
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: isFinal 
              ? '❌ *Action:* Monitor has crashed permanently. Manual intervention required.'
              : '🔄 *Action:* Attempting to restart monitor...'
          }
        }
      ]
    };

    await this.slackClient.chat.postMessage(message);
  }

  private scheduleRestart() {
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000); // Exponential backoff, max 30s
    cleanupLogger.info(`Scheduling restart in ${delay}ms...`);
    
    setTimeout(() => {
      cleanupLogger.info('Restarting monitor...');
      process.exit(0); // Let the process manager restart the service
    }, delay);
  }
}

// Initialize the crash handler
new MonitorCrashHandler(); 